---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debugging von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-24T04:56:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5918cb5b245d31ff212d4c22c66636491ee4dd2eb12f8c2c1939415ab493f994
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die zentrale Steuerungsebene und der Node-Transport für
OpenClaw. Operator- und Node-Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes,
headless Nodes) stellen über WebSocket eine Verbindung her und deklarieren beim
Handshake eine **Rolle** und einen **Scope**.

## npm-Pakete

Diese Pakete werden mit den OpenClaw-Release-Zyklen ausgeliefert. Während der anfänglichen Einführung
kann npm `E404` zurückgeben, bis das erste Release mit diesen Paketen veröffentlicht wird.

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  veröffentlicht die Schemas, Validatoren, TypeScript-Typen, schlanken Frame- und Fehler-
  Hilfsfunktionen sowie Versionskonstanten. Das Tarball enthält den generierten
  maschinenlesbaren Vertrag [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json).
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  veröffentlicht den Referenz-Node-Client und einen browsersicheren Einstiegspunkt unter
  `@openclaw/gateway-client/browser`.

Hinweise zum Anwendungslebenszyklus finden Sie unter
[Gateway-Client erstellen](https://docs.openclaw.ai/gateway/clients). Informationen zu Apps,
die das Gateway als untergeordneten Prozess überwachen, finden Sie unter
[OpenClaw einbetten](https://docs.openclaw.ai/gateway/embedding).

## Transport und Framing

- WebSocket, Text-Frames, JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Frames vor dem Verbindungsaufbau sind auf 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`) begrenzt. Nach
  dem Handshake gelten `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes`. Bei aktivierter Diagnose lösen übergroße
  eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse aus, bevor
  das Gateway die Verbindung schließt oder den Frame verwirft. Diese Ereignisse enthalten `surface`, Byte-
  Größen, Grenzwerte und einen sicheren Ursachencode, jedoch niemals Nachrichteninhalte, Anhangs-
  inhalte, rohe Frame-Bytes, Tokens, Cookies oder Secrets.

Frame-Strukturen:

- Anfrage: `{type:"req", id, method, params}`
- Antwort: `{type:"res", id, ok, payload|error}`
- Ereignis: `{type:"event", event, payload, seq?, stateVersion?}`

Antwortfehler verwenden `{ code, message, details?, retryable?, retryAfterMs? }`.
Clients sollten nach `code` und `details.code` verzweigen; `message` bleibt menschenlesbar
und kann sich ändern, sofern ein Kompatibilitätshinweis nichts anderes angibt. Autorisierungsfehler
auf Methodenebene verwenden `code: "FORBIDDEN"` auf oberster Ebene mit strukturierten
Details zu fehlenden Scopes:

- Fehlender Scope: `{ code: "MISSING_SCOPE", missingScope, requiredScopes }`.
  `requiredScopes` ist die vollständige bekannte Scope-Menge für die angeforderte Operation.
  Die veraltete `missing scope: <scope>`-Nachricht bleibt für ältere Clients erhalten.

Clients sollten zuerst `details` lesen und die veraltete Nachricht nur als Kompatibilitäts-
Fallback verwenden. `readMissingScopeError` und `readMissingScopeErrorDetails` werden aus
`@openclaw/gateway-protocol/gateway-error-details` exportiert; der browsersichere Gateway-Client
exportiert sie erneut aus `@openclaw/gateway-client/browser`.

Die Schemas werden als `GatewayErrorDetailsSchema`,
`MissingScopeErrorDetailsSchema` aus `@openclaw/gateway-protocol/schema` exportiert.
HTTP-Scope-Fehler spiegeln das `MISSING_SCOPE`-Objekt unter `error.details` wider und
verwenden den HTTP-Status `403`.

Methoden mit Nebenwirkungen erfordern Idempotenzschlüssel (siehe Schema).

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

`server`, `features`, `snapshot`, `policy` und `auth` werden alle von
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`) vorausgesetzt. `auth`
meldet die ausgehandelte Rolle und die ausgehandelten Scopes, auch wenn kein Geräte-Token ausgegeben wird (Struktur
oben). `pluginSurfaceUrls` ist optional und ordnet Plugin-Oberflächennamen (z. B.
`canvas`) bereichsgebundenen gehosteten URLs zu; der Eintrag kann ablaufen, daher rufen Nodes
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` auf, um einen aktuellen Eintrag abzurufen.
Der veraltete Pfad `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
wird nicht unterstützt; verwenden Sie Plugin-Oberflächen.
Das optionale `appliedConfigHash` des Snapshots ist die aufgelöste Revision der Quellkonfiguration,
die von der aktiven Gateway-Laufzeit akzeptiert wurde. Clients können sie mit
`config.get.configRevisionHash` vergleichen, um festzustellen, ob eine neuere gespeicherte Konfiguration weiterhin
einen Neustart erfordert. `config.get.hash` bleibt die unverarbeitete Revision der Stammdatei, die von
Konfigurationsschreibvorgängen zur Konfliktvermeidung verwendet wird.

Während das Gateway den Start seiner Sidecars noch abschließt, kann `connect` einen
wiederholbaren `UNAVAILABLE`-Fehler mit `details.reason: "startup-sidecars"` und
`retryAfterMs` zurückgeben. Wiederholen Sie den Vorgang innerhalb Ihres Verbindungszeitbudgets, statt dies als
endgültigen Handshake-Fehler zu behandeln.

Wenn ein Geräte-Token ausgegeben wird, fügt `hello-ok.auth` ihn hinzu:

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
Operator-Schleife und die native Einrichtung zu starten, einschließlich `operator.talk.secrets` für Lesezugriffe auf die Talk-
Konfiguration, umfasst jedoch keine Scopes für Pairing-Änderungen und kein `operator.admin`. Ein umfassenderer
Pairing-/Administratorzugriff erfordert einen separaten genehmigten Pairing- oder Token-Ablauf. Speichern Sie
`hello-ok.auth.deviceTokens` nur dann dauerhaft, wenn die Bootstrap-Authentifizierung über einen vertrauenswürdigen
Transport erfolgte (`wss://` oder Loopback/lokales Pairing).

Vertrauenswürdige Backend-Clients im selben Prozess (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen auslassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/-Passwort authentifizieren. Dieser Pfad ist
internen Steuerungsebenen-RPCs vorbehalten (z. B. Sitzungsaktualisierungen von Subagenten) und verhindert,
dass veraltete CLI-/Geräte-Pairing-Basiswerte lokale Backend-Arbeit blockieren. Entfernte
Clients, Clients mit Browser-Ursprung, Nodes sowie Clients mit explizitem Geräte-Token oder expliziter Geräteidentität durchlaufen weiterhin
die normalen Prüfungen für Pairing und Scope-Erweiterungen.

### Worker-Rolle und geschlossenes Protokoll

Cloud-Worker verwenden einen dedizierten Loopback-Eingang durch den Gateway-eigenen,
an den Hostschlüssel gebundenen SSH-Tunnel. Er akzeptiert ausschließlich Worker-Identitäten und leitet niemals
allgemeine Authentifizierung, Node-Ereignisse, Operator-RPCs oder Plugin-Methoden weiter. Ein striktes `connect`
überprüft einen ruhenden Hash eines kurzlebigen Berechtigungsnachweises, der an die Umgebung, den Bundle-
Hash, die Eigentümerepoche, die RPC-Set-Version, den Ablaufzeitpunkt und eine optionale Sitzung gebunden ist; zusätzlich
werden die aktuelle Version und der Funktionsumfang separat geprüft. Bei Erfolg wird ein minimales
`worker-hello-ok` zurückgegeben; die Funktionsaushandlung ist unabhängig von der allgemeinen Protokoll-
version. Frames bleiben unter 64 KiB, mit Ausnahme eines ausgehandelten `worker.inference.start`-
Frames, der bis zu 25 MiB groß sein darf. Die geschlossene Positivliste enthält `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` und
`worker.inference.cancel`.

Transkript-Commits verwenden eine Begrenzung durch die Eigentümerepoche, eine Gateway-eigene Sitzungsbindung,
Compare-and-Swap für das Basisblatt sowie eine dauerhafte Sequenzwiedergabe; das Gateway erzeugt
Transkripteintrags- und übergeordnete IDs über den normalen Sitzungsschreiber. Eigentümerschaft und
Ablauf werden bei jedem RPC erneut geprüft.

### Client-Fähigkeiten

Operator-Clients können optionale Fähigkeiten in `connect.params.caps` bekannt geben:

- `tool-events`: akzeptiert strukturierte Ereignisse des Tool-Lebenszyklus.
- `inline-widgets`: kann gehostete Inline-Widget-Tool-Ergebnisse darstellen.

Client-Fähigkeiten beschreiben den verbundenen Client, nicht die Autorisierung. Agent-Tools können erforderliche Fähigkeiten deklarieren; das Gateway lässt diese Tools aus, sofern nicht jede Anforderung in `caps` des ursprünglichen Clients enthalten ist. Von Kanälen ausgehende Ausführungen haben keine Gateway-Client-Fähigkeiten, daher sind fähigkeitsgebundene Tools auch dann nicht verfügbar, wenn die Tool-Richtlinie sie ausdrücklich zulässt.

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

Nodes deklarieren beim Verbindungsaufbau beanspruchte Fähigkeiten:

- `caps`: übergeordnete Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: Befehls-Positivliste für Aufrufe.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese Angaben als Behauptungen und erzwingt serverseitige Positivlisten.

## Rollen und Scopes

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und die
Semantik gemeinsamer Secrets finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

Rollen:

- `operator`: Client der Steuerungsebene (CLI/UI/Automatisierung).
- `node`: Fähigkeitshost (Kamera/Bildschirm/Canvas/system.run).
- `worker`: Cloud-Ausführungshost im dedizierten, geschlossenen Worker-Protokoll.

Operator-Scopes (`src/gateway/operator-scopes.ts`), die vollständige geschlossene Menge:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets` (oder
`operator.admin`). Wenn Secrets enthalten sind, lesen Sie den Berechtigungsnachweis des aktiven Talk-Providers
aus `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
behält die Struktur der Quelle bei und kann ein SecretRef-Objekt oder eine redigierte Zeichenfolge sein.

Vom Plugin registrierte Gateway-RPC-Methoden können einen eigenen Operator-Scope anfordern,
diese reservierten Core-Präfixe werden jedoch immer in `operator.admin`
(`src/shared/gateway-method-policy.ts`) aufgelöst: `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Der Methoden-Scope ist nur die erste Schranke. Einige über
`chat.send` erreichte Slash-Befehle wenden strengere Prüfungen auf Befehlsebene an: Dauerhafte Schreibvorgänge für `/config set` und
`/config unset` erfordern `operator.admin`, selbst bei Gateway-Clients, die
bereits über einen niedrigeren Operator-Scope verfügen.

`node.pair.approve` verfügt zusätzlich zum grundlegenden
Methoden-Scope (`operator.pairing`) über eine weitere Scope-Prüfung zum Genehmigungszeitpunkt, die auf dem deklarierten
`commands` (`src/infra/node-pairing-authz.ts`) der ausstehenden Anfrage basiert:

| Deklarierte Befehle                                                                                                           | Erforderliche Bereiche                  |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| keine                                                                                                                         | `operator.pairing`                      |
| gewöhnliche Befehle                                                                                                           | `operator.pairing` + `operator.write` |
| enthält `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` oder `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Fähigkeiten/Befehle/Berechtigungen (Node)

Nodes deklarieren beim Verbindungsaufbau Angaben zu ihren Fähigkeiten:

- `caps`: übergeordnete Fähigkeitskategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Positivliste der Befehle für Aufrufe.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Der Gateway behandelt diese als **Angaben** und erzwingt serverseitige Positivlisten.
Verbundene Nodes können nach einem erfolgreichen Verbindungsaufbau oder einer
erneuten Verbindung optionale, für Agenten sichtbare Plugin- oder MCP-Tool-
Deskriptoren mit `node.pluginTools.update` veröffentlichen. Headless-Node-Hosts werden neu
gestartet, um Änderungen am deklarativen MCP-Inventar anzuwenden. Diese
Aktualisierungsmethode ist der einzige Veröffentlichungsweg; Plugin-Tool-Deskriptoren
werden in den Parametern von `connect` nicht akzeptiert. Jeder Deskriptor
muss einen providersicheren Tool-`name` verwenden und einen
`command` aus der aktuellen Befehlspositivliste der Node benennen. Der
Gateway vertraut den Deskriptormetadaten der gekoppelten Node, filtert Deskriptoren
außerhalb der genehmigten Befehlsoberfläche, entfernt sie beim Trennen der Node und
weist Versuche von Operatoren zurück, den Katalog einer anderen Node zu ändern.
Legen Sie `gateway.nodes.pluginTools.enabled: false` fest, um von Nodes veröffentlichte Deskriptoren zu
ignorieren.

Verbundene Node-Hosts veröffentlichen ihren vollständigen Katalog zum Ersetzen von
Skills mit `node.skills.update`. Diese Methode der Node-Rolle ist der einzige
Veröffentlichungsweg für Node-Skills; Skills werden in den Parametern von
`connect` nicht akzeptiert. Jeder Deskriptor enthält einen sicheren Namen,
eine Beschreibung und begrenzten `SKILL.md`-Inhalt. Der Gateway analysiert
diesen Inhalt mit dem normalen Skills-Loader, nimmt ihn in Snapshots der Agenten-
Skills auf, solange die Node verbunden ist, und entfernt ihn bei der Trennung. Legen
Sie `gateway.nodes.allowSkills: false` fest, um von Nodes veröffentlichte Skills zu ignorieren.

## Präsenz

- `system-presence` gibt nach Geräteidentität indizierte Einträge
  zurück, einschließlich `deviceId`, `roles` und
  `scopes`, sodass Benutzeroberflächen eine Zeile pro Gerät anzeigen
  können, selbst wenn es sowohl als Operator als auch als Node verbunden ist.
- `node.list` enthält optional `lastSeenAtMs` und
  `lastSeenReason`. Verbundene Nodes melden die aktuelle Verbindungszeit mit dem
  Grund `connect`; gekoppelte Nodes können außerdem über ein
  vertrauenswürdiges Node-Ereignis eine dauerhafte Hintergrundpräsenz melden.

Native macOS-Nodes können außerdem authentifizierte `node.presence.activity`-Ereignisse
mit begrenzter Leerlaufzeit der Eingabe senden. Der Gateway leitet
Aktivitätszeitstempel anhand seiner eigenen Uhr ab, stellt den aktuellsten
verbundenen Mac über `node.list` und `node.describe` bereit und sendet
`node.presence`-Aktualisierungen an Clients mit Leseberechtigung. Die App sendet
`{ "action": "clear" }`, wenn der Benutzer die Aktivitätsfreigabe deaktiviert; der
Gateway löscht Zeitstempel nur für genau diese authentifizierte Node-Verbindung.
Gateways, die älter als diese bestätigte Aktion sind, geben sie als unbehandelt
zurück. Daher stellt die Mac-Node einmal erneut eine Verbindung her und lässt den
alten Verbindungsstatus durch die Bereinigung beim Trennen entfernen. Informationen
zu Auswahl, Datenschutz, Modellkontext und dem Routing von Benachrichtigungen finden
Sie unter [Präsenz des aktiven Computers](/de/nodes/presence).

### Ereignis für aktive Node im Hintergrund

Nodes rufen `node.event` mit `event: "node.presence.alive"` auf, um zu erfassen, dass eine
gekoppelte Node während einer Hintergrundaktivierung aktiv war, ohne sie als
verbunden zu markieren:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peters iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist eine geschlossene Aufzählung: `background`,
`silent_push`, `bg_app_refresh`, `significant_location`, `manual`,
`connect`. Unbekannte Werte werden zu `background`
(`src/shared/node-presence.ts`) normalisiert. Das Ereignis wird nur für authentifizierte
Node-Gerätesitzungen dauerhaft gespeichert; Sitzungen ohne Gerät oder ohne Kopplung
geben `handled: false` zurück.

Erfolgreiche Gateways geben ein strukturiertes Ergebnis zurück:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Ältere Gateways geben für `node.event` möglicherweise nur
`{ "ok": true }` zurück; behandeln Sie dies als bestätigten RPC und nicht als
dauerhafte Speicherung der Präsenz.

## Bereichssteuerung von Broadcast-Ereignissen

Vom Server übertragene Broadcast-Ereignisse werden nach Bereichen eingeschränkt,
sodass auf Kopplung beschränkte oder ausschließlich für Nodes vorgesehene Sitzungen
nicht passiv Sitzungsinhalte empfangen (`src/gateway/server-broadcast.ts`):

- Chat-, Agenten- und Tool-Ergebnis-Frames (gestreamte
  `agent`-Ereignisse, Tool-Ergebnis-Ereignisse) erfordern mindestens
  `operator.read`. Sitzungen ohne diesen Bereich überspringen diese Frames
  vollständig.
- Von Plugins definierte `plugin.*`-Broadcasts sind
  standardmäßig auf `operator.write` oder `operator.admin` beschränkt;
  explizite Einträge wie `plugin.approval.requested` / `plugin.approval.resolved` verwenden
  stattdessen `operator.approvals`.
- Status-/Transportereignisse (`heartbeat`,
  `presence`, `tick`, Lebenszyklus von Verbindungsaufbau und
  -trennung) bleiben uneingeschränkt, damit der Transportzustand für jede
  authentifizierte Sitzung beobachtbar ist.
- Unbekannte Familien von Broadcast-Ereignissen werden
  standardmäßig nach Bereichen eingeschränkt (bei Unsicherheit abgelehnt), sofern
  ein registrierter Handler diese Einschränkung nicht ausdrücklich lockert.

Jede Clientverbindung führt ihre eigene clientspezifische Sequenznummer, sodass
Broadcasts auf diesem Socket weiterhin monoton geordnet bleiben, selbst wenn
verschiedene Clients unterschiedliche, nach Bereichen gefilterte Teilmengen des
Ereignisstroms sehen.

## RPC-Methodenfamilien

`hello-ok.features.methods` ist eine konservative Erkennungsliste, die aus
`src/gateway/server-methods-list.ts` sowie den exportierten Methoden geladener Plugins und Kanäle
erstellt wird. Sie ist kein generierter Auszug aller Methoden, und einige Methoden
(zum Beispiel `push.test`, `web.login.start`, `web.login.wait`,
`sessions.usage`) sind absichtlich von der Erkennung ausgeschlossen, obwohl sie
reale, aufrufbare Methoden sind. Behandeln Sie dies als Funktionserkennung und nicht
als vollständige Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder neu geprüften Snapshot des Gateway-Zustands zurück.
    - `diagnostics.stability` gibt den aktuellen, begrenzten Diagnose-Stabilitätsrekorder zurück: Ereignisnamen, Anzahlen, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Keine Chattexte, Webhook-Inhalte, Tool-Ausgaben, rohen Anfrage-/Antwortinhalte, Tokens, Cookies oder Geheimnisse. Erfordert `operator.read`.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; vertrauliche Felder nur für Operator-Clients mit Administratorbereich.
    - `gateway.identity.get` gibt die Geräteidentität des Gateways zurück, die von Relay- und Kopplungsabläufen verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` fügt ein Systemereignis an und kann den Präsenzkontext aktualisieren und übertragen.
    - `last-heartbeat` gibt das neueste dauerhaft gespeicherte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.
    - `gateway.suspend.prepare` erstellt nur dann eine kurze Lease zur kooperativen Aussetzung, wenn die erfasste Gateway-Arbeit inaktiv ist. `gateway.suspend.status` prüft diese Lease, und `gateway.suspend.resume` gibt sie nach dem Fortsetzen oder einem abgebrochenen Hostvorgang frei.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zulässigen Modellkatalog zurück. Siehe „`models.list`-Ansichten“ weiter unten.
    - `usage.status` gibt Zusammenfassungen der Nutzungszeiträume und verbleibenden Kontingente des Providers zurück.
    - `usage.cost` gibt aggregierte Zusammenfassungen der Kostennutzung für einen Datumsbereich zurück. Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft des Vektorspeichers bzw. der zwischengespeicherten Einbettungen für den aktiven Standardarbeitsbereich des Agenten zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur für einen expliziten Live-Ping des Einbettungsproviders. Übergeben Sie `{ "agentId": "agent-id" }`, um die Statistiken des Dreaming-Speichers auf einen Agentenarbeitsbereich zu beschränken; wird der Wert weggelassen, werden konfigurierte Dreaming-Arbeitsbereiche aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optional `{ "agentId": "agent-id" }`; wird der Wert weggelassen, arbeiten sie mit dem konfigurierten Standardarbeitsbereich des Agenten.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Clients der Steuerungsebene zurück, einschließlich Arbeitsbereichspfaden, Speicherausschnitten, gerendertem fundiertem Markdown und Kandidaten für eine umfassende Übernahme. Erfordert `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten gemeinsam aufzulisten.
      Beide Nutzungsmethoden akzeptieren `mode: "specific"` mit einer IANA-`timeZone` für Sommerzeit berücksichtigende Kalendertagesgrenzen und Intervalle. `utcOffset` wird weiterhin für ältere Clients und als Rückfalloption unterstützt, wenn die Gateway-Laufzeit die angeforderte Zone nicht erkennt.
    - `sessions.usage.timeseries` gibt die Zeitreihennutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal bzw. ein bestimmtes Konto ab, sofern der Kanal dies unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldeablauf für den aktuellen QR-fähigen Provider des Webkanals.
    - `web.login.wait` wartet auf den Abschluss dieses Ablaufs und startet den Kanal bei Erfolg.
    - `push.test` sendet eine APNs-Test-Push-Benachrichtigung an eine registrierte iOS-Node.
    - `voicewake.get` gibt die gespeicherten Aktivierungswort-Auslöser zurück.
    - `voicewake.set` aktualisiert die Aktivierungswort-Auslöser und überträgt die Änderung.

  </Accordion>

  <Accordion title="Plugin-Verwaltung">
    - `plugins.list` (`operator.read`) gibt das Inventar der installierten Plugins sowie lokal kuratierte offizielle Empfehlungen, Diagnosedaten und die Angabe zurück, ob der aktuelle Installationsmodus Änderungen zulässt.
    - `plugins.search` (`operator.read`) sucht nach installierbaren ClawHub-Code-Plugin- und Bundle-Plugin-Familien. Übergeben Sie einen nicht leeren Wert für `query` und optional einen Wert für `limit` von 1 bis 100.
    - `plugins.install` (`operator.admin`) installiert entweder einen offiziellen Katalogeintrag mit `{ source: "official", pluginId }` oder ein ClawHub-Paket mit `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. ClawHub-Installationen behalten die Vertrauens-, Integritäts- und Installationsrichtlinienprüfungen des Gateways bei. Erfolgreiche Installationen erfordern einen Neustart des Gateways.
    - `plugins.setEnabled` (`operator.admin`) ändert mit `{ pluginId, enabled }` die Aktivierungsrichtlinie eines installierten Plugins. Die Antwort enthält den aktualisierten Katalogeintrag, Neustartmetadaten und etwaige Warnungen zur Slot-Auswahl.
    - `plugins.uninstall` (`operator.admin`) entfernt mit `{ pluginId }` ein extern installiertes Plugin: Konfigurationsverweise, den Installationsdatensatz und verwaltete Dateien. Gebündelte Plugins können nicht deinstalliert, sondern nur deaktiviert werden. Die Antwort führt die Entfernungsschritte auf und erfordert immer einen Neustart des Gateways.

  </Accordion>

  <Accordion title="Nachrichten und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellungen bei kanal-, konto- und threadbezogenen Sendevorgängen außerhalb des Chat-Runners.
    - `logs.tail` gibt das Ende des konfigurierten Gateway-Dateiprotokolls mit Cursor-/Limit- und Maximalbyte-Steuerung zurück.

  </Accordion>

  <Accordion title="Operator-Terminal">
    - `terminal.open` startet ein Host-PTY für einen expliziten `agentId` oder den Standard-Agenten und gibt den aufgelösten Agenten, das Arbeitsverzeichnis, die Shell und den Einschränkungsstatus zurück.
    - `terminal.input`, `terminal.resize` und `terminal.close` arbeiten ausschließlich mit Sitzungen, die der aufrufenden Verbindung gehören.
    - `terminal.upload` akzeptiert eine Base64-Datei mit bis zu 16 MiB, legt sie in einem privaten temporären Verzeichnis mit einer Lebensdauer von 24 Stunden auf dem Gateway der Sitzung oder dem Host des gekoppelten Nodes bereit und gibt den absoluten Pfad zurück. Der Aufrufer muss diesen Pfad weiterhin einfügen oder anderweitig verwenden; der RPC schreibt niemals Terminaleingaben und führt keinen Befehl aus.
    - Die Ereignisse `terminal.data` und `terminal.exit` werden nur an die Verbindung gestreamt, der die Sitzung gehört.
    - Sitzungen, deren Verbindung abbricht, werden getrennt und nicht beendet: Sie können für `gateway.terminal.detachedSessionTimeoutSeconds` erneut verbunden werden (Standardwert 300; `0` stellt das Beenden bei Verbindungsabbruch wieder her), während die neuesten Ausgaben in einem begrenzten serverseitigen Puffer gesammelt werden.
    - `terminal.list` gibt verbindbare Sitzungen zurück; `terminal.attach` bindet eine aktive oder getrennte Sitzung an die aufrufende Verbindung und gibt den Wiedergabepuffer zurück (Übernahme nach tmux-Art – ein vorheriger aktiver Besitzer erhält `terminal.exit` mit dem Grund `detached`); `terminal.text` liest den Puffer als Klartext, ohne eine Verbindung herzustellen.
    - Jede Terminalmethode erfordert `operator.admin`; `gateway.terminal.enabled` muss explizit auf „true“ gesetzt sein. Vollständig sandboxisolierte Agenten werden abgelehnt, und eine Änderung der Agentenrichtlinie schließt bestehende und gerade gestartete PTYs einschließlich getrennter PTYs.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Katalog der Talk-Provider für Sprachwiedergabe, Streaming-Transkription und Echtzeit-Sprache zurück: kanonische Provider-IDs, Registry-Aliasse, Bezeichnungen, Konfigurationsstatus, ein optionales `ready`-Ergebnis auf Gruppenebene, verfügbare Modell-/Stimmen-IDs, kanonische Modi, Transporte, Brain-Strategien sowie Echtzeit-Audio- und Funktionsflags, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu ändern. Aktuelle Gateways setzen `ready` nach Anwendung der Laufzeit-Providerauswahl; bei älteren Gateways gilt das Fehlen dieses Werts als nicht verifiziert.
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Für `stt-tts/managed-room` müssen `operator.write`-Aufrufer, die `sessionKey` übergeben, auch `spawnedBy` für die bereichsgebundene Sichtbarkeit des Sitzungsschlüssels übergeben; die Erstellung von `sessionKey` ohne Bereichsbindung und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Sitzungstoken für einen verwalteten Raum, gibt bei Bedarf `session.ready` oder `session.replaced` aus und liefert Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse zurück, jedoch niemals das Klartexttoken oder dessen Hash.
    - `talk.session.appendAudio` hängt Base64-codierte PCM-Audioeingaben an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus verwalteter Räume, wobei veraltete Turns abgelehnt werden, bevor der Status gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Unterbrechen in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Die Anfrage wartet auf jedes asynchrone Abschlusssignal, das von der Provider-Bridge bereitgestellt wird; fehlgeschlagene Übermittlungen lassen den verknüpften Lauf aktiv und geben kein erfolgreiches Tool-Ergebnisereignis aus. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgaben oder `options: { suppressResponse: true }`, wenn die Provider-Bridge Unterdrückung unterstützt und das Ergebnis keine weitere Antwort starten soll.
    - `talk.session.steer` sendet die Sprachsteuerung für einen aktiven Lauf an eine Gateway-eigene, agentengestützte Talk-Sitzung: `{ sessionId, text, mode? }`, wobei `mode` den Wert `status`, `steer`, `cancel` oder `followup` hat; ein ausgelassener Modus wird anhand des gesprochenen Textes klassifiziert.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder verwaltete Raumsitzung und gibt abschließende Talk-Ereignisse aus.
    - `talk.mode` legt den aktuellen Talk-Modusstatus für WebChat-/Control-UI-Clients fest bzw. überträgt ihn.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket` oder setzt sie fort, während das Gateway Anmeldedaten, Anweisungen, Tool-Richtlinie und den zurückgegebenen `voiceSessionId` verwaltet. Clients übergeben `sessionKey` und verwenden `voiceSessionId` erneut, wenn der Provider-Transport während eines Anrufs ersetzt wird.
    - `talk.client.transcript` hängt ein abgeschlossenes `{ role, text }`-Element an die normale Agentensitzung an. Der erforderliche Wert `entryId` ist innerhalb von `voiceSessionId` idempotent; Wiederholungsversuche duplizieren keine Transkriptnachrichten.
    - `talk.client.close` schließt die logische Sprachsitzung nach ausstehenden Transkriptschreibvorgängen. Das Schließen ist idempotent und kann eine nur Änderungen enthaltende Anrufzusammenfassung an den letzten Nicht-WebChat-Kanal der Sitzung senden.
    - `talk.client.toolCall` ermöglicht client-eigenen Echtzeit-Transporten, Provider-Tool-Aufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Lauf-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis übermitteln. Sprachgebundene Aktionen mit hoher Auswirkung geben `VOICE_CONFIRMATION_REQUIRED:<id>` zurück, bis eine spätere abgeschlossene Benutzeräußerung genau diese Aktion ausdrücklich bestätigt und die nächste Abfrage den `confirmationId` bereitstellt.
    - `talk.client.steer` sendet die Sprachsteuerung für einen aktiven Lauf an client-eigene Echtzeit-Transporte. Das Gateway löst den aktiven eingebetteten Lauf anhand von `sessionKey` auf und gibt ein strukturiertes Ergebnis für Annahme oder Ablehnung zurück, statt die Steuerung stillschweigend zu verwerfen.
    - `talk.event` ist der zentrale Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT-/TTS-, verwaltete Raum-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprachprovider.
    - `tts.status` gibt den TTS-Aktivierungsstatus, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt das sichtbare Inventar der TTS-Provider zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungsstatus um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.
    - `tts.speak` (`operator.write`) rendert einen nicht leeren Wert für `text` mit der konfigurierten allgemeinen TTS-Provider-Kette und gibt einen vollständigen Clip inline als `audioBase64` sowie `provider` und optionale Metadaten für `outputFormat`, `mimeType` und `fileExtension` zurück. Anders als `tts.convert` gibt es keinen Gateway-lokalen Pfad zurück; anders als `talk.speak` erfordert es keinen Talk-Provider. Text oberhalb von `tts.maxTextLength` gibt `INVALID_REQUEST` zurück; Synthesefehler geben `UNAVAILABLE` zurück.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Aktualisierung und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und veröffentlicht atomar einen eigentümerbezogenen Laufzeitstatus. Zulässige Eigentümerfehler können mit `warningCount` als kalte oder veraltete Beeinträchtigung veröffentlicht werden; strikte oder nicht zugeordnete Fehler lehnen das erneute Laden ab und bewahren den aktiven Snapshot.
    - `secrets.resolve` löst Zuweisungen von Befehlsziel-Secrets für eine bestimmte Gruppe von Befehlen und Zielen auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot auf dem Datenträger, die rohe Stammdatei `hash`, das aufgelöste `configRevisionHash` und optional `appliedConfigHash` für die aufgelöste Revision zurück, die von der aktiven Gateway-Laufzeit akzeptiert wurde.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt eine partielle Konfigurationsaktualisierung zusammen. Das destruktive Ersetzen von Arrays erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays unter Array-Einträgen verwenden `[]`-Pfade wie `agents.entries.*.skills`.
    - `config.apply` validiert und ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die von Control UI und CLI-Werkzeugen verwendete Live-Konfigurationsschemanutzlast zurück: Schema, `uiHints`, Version, Generierungsmetadaten sowie Plugin- und Kanalschemametadaten, sofern sie geladen werden können. Sie enthält `title`- / `description`-Metadaten aus denselben Beschriftungen und Hilfetexten wie die Benutzeroberfläche, einschließlich verschachtelter Objekt-, Platzhalter-, Array-Element- und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn eine passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Nachschlagenutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, übereinstimmender Hinweis und `hintPath`, optional `reloadKind` sowie Zusammenfassungen der unmittelbar untergeordneten Elemente für die Detailnavigation in Benutzeroberfläche und CLI. `reloadKind` ist entweder `restart`, `hot` oder `none` (`src/config/schema.ts`) und entspricht dem Planer für das erneute Laden der Gateway-Konfiguration für den angeforderten Pfad. Nachschlage-Schemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder bei (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, Grenzwerte für Zahlen, Zeichenfolgen, Arrays und Objekte, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Zusammenfassungen untergeordneter Elemente stellen `key`, das normalisierte `path`, `type`, `required`, `hasChildren`, optional `reloadKind` sowie die übereinstimmenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Aktualisierungsablauf aus und plant nur dann einen Neustart, wenn die Aktualisierung erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einbeziehen, damit der Start über die Neustart-Fortsetzungswarteschlange einen nachfolgenden Agent-Durchlauf fortsetzt. Paketmanager-Aktualisierungen und überwachte Aktualisierungen von Git-Checkouts über die Steuerungsebene verwenden eine abgekoppelte Übergabe an einen verwalteten Dienst, statt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgaben innerhalb des laufenden Gateway zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück. Ein zweites gleichzeitiges `update.run`, das vom selben Gateway-Prozess verarbeitet wird, gibt `ok: false` mit `result.reason: "managed-service-handoff-already-running"` und `handoff.status: "already-running"` zurück; seine Fortsetzung wird nicht akzeptiert, sodass der Aufrufer es nach Abschluss der aktiven Aktualisierung erneut versuchen kann. Eigenständige CLI-Aktualisierungsprogramme und Ersatz-Gateway-Prozesse fallen nicht unter diese prozesslokale Schutzvorrichtung. Nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` sowie `handoff.command` zurück, wenn eine manuelle Shell-Aktualisierung erforderlich ist. Nicht verfügbar bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Dienstidentität besitzt, beispielsweise `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurzzeitig `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI den neu gestarteten Gateway überprüft und den endgültigen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Neustart-Sentinel der Aktualisierung und gibt ihn zurück, einschließlich der nach dem Neustart ausgeführten Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS-RPC bereit.

  </Accordion>

  <Accordion title="Hilfsfunktionen für Agent und Arbeitsbereich">
    - `agents.list` gibt die für den Gateway sichtbaren Agent-Einträge zurück, einschließlich effektiver Modell-/Laufzeitmetadaten und optionalem semantischem `kind` (`agent` oder `system`). Clients geben die Handshake-Fähigkeit `agent-kind` an, um die vollständige typisierte Liste zu erhalten; Clients ohne diese Fähigkeit behalten die aus Gründen der Abwärtskompatibilität für Auswahlfelder geeignete Liste ohne Systemzeilen. Typbewusste Clients schließen `system`-Zeilen aus gewöhnlichen Auswahlfeldern aus, behalten sie jedoch in Diagnoseansichten bei. Ältere v4-Gateways können Zeilen ohne `kind` zurückgeben.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und die Verknüpfung von Arbeitsbereichen.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die für einen Agent bereitgestellten Bootstrap-Arbeitsbereichsdateien.
    - `audit.activity.list` gibt das versionierte, ausschließlich Metadaten enthaltende Aktivitätsjournal zurück; `audit.list` bleibt das kompatibilitätssichere Ausführungs-/Werkzeug-RPC.
    - `agents.workspace.list` und `agents.workspace.get` (`operator.read`) ermöglichen Clients in der unter [Operator-Bereiche](/de/gateway/operator-scopes) beschriebenen vertrauenswürdigen Operator-Domäne das schreibgeschützte, paginierte Durchsuchen des Arbeitsbereichsverzeichnisses eines Agents. Anforderungen akzeptieren nur arbeitsbereichsrelative Pfade; Lesezugriffe bleiben auf den anhand des realen Pfads aufgelösten Stamm des Arbeitsbereichs beschränkt (Ausbrüche über symbolische und harte Links werden abgelehnt), sind größenbeschränkt und auf UTF-8-Text sowie gängige Bildtypen (Base64) begrenzt. Antworten legen den Arbeitsbereichspfad des Hosts nicht offen. In diesem Namensraum gibt es keine Schreiboperationen.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgabenjournal für SDK- und Operator-Clients bereit. Siehe nachfolgend [RPCs des Aufgabenjournals](#task-ledger-rpcs).
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Bereich bereit. Ausführungs- und Aufgabenabfragen lösen die besitzende Sitzung serverseitig auf und geben nur Transkriptmedien mit übereinstimmender Herkunft zurück; unsichere oder lokale URL-Quellen führen zu nicht unterstützten Downloads, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` bewahren die Gateway-lokale und Node-Umgebungserkennung. Konfigurierte Cloud-Worker und dauerhafte Datensätze, die von früheren Profilen hinterlassen wurden, ergänzen `worker`-Metadaten mit `providerId`, optional `leaseId`, `state`, `ageMs`, optional `idleMs` und `attachedSessionIds`. Die Lebenszyklusstatus von Workern sind `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` und `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) stellt einen Worker aus einem konfigurierten Provider-Profil eines Plugins bereit; Wiederholungsversuche mit demselben Schlüssel verwenden den dauerhaften Vorgang erneut. `environments.destroy` (`{ environmentId }`) fordert den idempotenten Abbau einer dauerhaften Worker-Umgebung an. Beide erfordern `operator.admin`, sind Schreibvorgänge der Steuerungsebene und geben dieselbe Form der Umgebungszusammenfassung zurück, die auch Statusantworten verwenden.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet auf den Abschluss einer Ausführung und gibt den abschließenden Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich der `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Runtime-Backend konfiguriert ist. Wenn die Platzierung auf Cloud-Workern aktiviert ist oder ein dauerhafter Wiederherstellungsstatus vorhanden ist, enthalten Sitzungszeilen außerdem einen abgeschlossenen `placement`-Status (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` oder `failed`) sowie statusabhängige Felder für Umgebung, Eigentümer-Epoche, Workspace, Bundle, ACK-Cursor oder Wiederherstellung.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client ein oder aus.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Abonnements für Transkript-/Nachrichtenereignisse einer Sitzung ein oder aus. Übergeben Sie `includeApprovals: true`, um zusätzlich bereinigte `session.approval`-Lebenszyklusereignisse für Genehmigungen zu empfangen, deren persistierte Zielgruppe genau diese Sitzung umfasst und deren Prüferbindung den abonnierenden Client autorisiert. Die Abonnementantwort enthält dann eine begrenzte ausstehende `approvalReplay`; sie ist maßgeblich, wenn `truncated` falsch ist. Die Aktivierung gilt pro Abonnementaufruf und ist nicht dauerhaft: Wenn dieselbe Sitzung ohne `includeApprovals: true` erneut abonniert wird, wird ein bestehendes Genehmigungsabonnement entfernt. Zusätzlich zur normalen Leseberechtigung für die Sitzung erfordert diese Aktivierung `operator.admin` oder `operator.approvals` auf einem gekoppelten Gerät.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag. Optionale Werte für `model` und `thinkingLevel` persistieren die anfänglichen Modell- und Reasoning-Überschreibungen atomar. `worktree: true` stellt einen verwalteten Worktree bereit; optionale Werte für `worktreeBaseRef`/`worktreeName` wählen die Basisreferenz und den Branchnamen aus, und `execNode` (`operator.admin`) bindet die Sitzungsausführung an einen Node-Host. Der erstellte Worktree wird im Ergebnis zurückgegeben und in der Sitzungszeile (`worktree: { id, branch, repoRoot }`) persistiert. Wenn der Eintrag erstellt, aber sein verschachteltes anfängliches `chat.send` abgelehnt wird, enthält das erfolgreiche Ergebnis `runStarted: false` und `runError`; Clients können den Prompt beibehalten und den Vorgang mit dem zurückgegebenen Sitzungsschlüssel wiederholen. Ein Aufrufer, der `parentSessionKey` mit `emitCommandHooks: true` übergibt, sollte außerdem die Lebenszyklusdisposition eines separaten untergeordneten Elements deklarieren: `succeedsParent: true` beendet das übergeordnete Element mit `session_end`, während `false` das übergeordnete Element aktiv hält und nur das `session_start` des untergeordneten Elements ausgibt. Wenn `succeedsParent` weggelassen wird, bleibt das bisherige Rollover-Verhalten des übergeordneten Elements für bestehende Clients erhalten. Die Disposition erfordert sowohl die Verknüpfung mit dem übergeordneten Element als auch Command-Hooks; ein Fork kann sein übergeordnetes Element nicht erfolgreich abschließen. Das direkte Zurücksetzungsverhalten der Hauptsitzung bleibt unverändert, da kein separates untergeordnetes Element erstellt wird. Neue Zeilen werden über die vertrauenswürdige Erstellungsschnittstelle mit einmalig schreibbarer Erstellungsprovenienz (`createdVia`, `createdActor`, `createdAt`) versehen; bei der Übernahme eines vorhandenen Schlüssels wird diese niemals neu gesetzt. Für menschliche Profilakteure wird `createdActor.label` bei der Projektion der Zeile aus dem aktuellen Benutzerprofil aufgelöst und niemals im Sitzungseintrag gespeichert, sodass Profilumbenennungen keine Abweichungen verursachen. Sitzungszeilen enthalten außerdem `parentSessionKey` (Navigations-Elternelement, persistiert), `controlOwnerSessionKey` (Runtime-Controller, wenn aktiv), `forkSource` (exakter Quellschlüssel + Transkriptgeneration für Forks) und `previousSessionId` (vorherige Transkriptgeneration unter demselben Schlüssel).
    - `sessions.dispatch` (`operator.admin`) verschiebt eine bestehende lokale OpenClaw-Sitzung mit einem sitzungseigenen verwalteten Worktree in ein konfiguriertes Cloud-Worker-Profil. Übergeben Sie `{ key, profileId, agentId? }`. Die Methode ist nicht vorhanden, wenn kein Worker-Profil konfiguriert ist, sperrt die Annahme lokaler Turns, bevor aktive Arbeit abgeschlossen wird, und gibt erst ein Ergebnis zurück, nachdem die Platzierung die Worker-Eigentümerschaft `active` erreicht hat. Die Weiterleitung erfolgt nur in eine Richtung; das Zurückholen vom Worker auf das lokale System ist nicht Bestandteil dieses RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` und `sessions.groups.delete` verwalten den Gateway-eigenen Katalog benutzerdefinierter Sitzungsgruppen (Namen + Anzeigereihenfolge). Die Mitgliedschaft verbleibt im Feld `category` jeder Sitzung; beim Umbenennen und Löschen werden die Mitgliedssitzungen serverseitig aktualisiert.
    - `sessions.send` sendet eine Nachricht an eine bestehende Sitzung.
    - `sessions.steer` ist die Variante zum Unterbrechen und Steuern einer aktiven Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Übergeben Sie `key` zusammen mit dem optionalen `runId` oder ausschließlich `runId` für aktive Ausführungen, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-überschreibungen und meldet das aufgelöste kanonische Modell sowie das wirksame `agentRuntime`. Die Spawn-Abstammung (`spawnedBy`, `spawnedWorkspaceDir`, `spawnedCwd`, `spawnDepth`, `subagentRole`, `subagentControlScope`) kann nicht mehr öffentlich gepatcht werden; diese Fakten werden von vertrauenswürdigen Erstellungspfaden einmalig geschrieben, und Anfragen, die sie weiterhin senden, werden abgelehnt.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen die Sitzungswartung durch.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` wird für UI-Clients zur Anzeige normalisiert: Eingebettete Direktiven-Tags werden aus dem sichtbaren Text entfernt, reine Text-XML-Nutzlasten von Tool-Aufrufen (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittene Tool-Aufrufblöcke) sowie offengelegte ASCII-/vollbreite Modellsteuerungstoken werden entfernt, reine Assistant-Zeilen mit Stille-Token (exakt `NO_REPLY` / `no_reply`) werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive, begrenzte Leser vollständiger Nachrichten für einen einzelnen sichtbaren Transkripteintrag. Übergeben Sie `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl Agent-bezogen ist, sowie ein Transkript-`messageId`, das zuvor über `chat.history` bereitgestellt wurde; das Gateway gibt dieselbe für die Anzeige normalisierte Projektion ohne die Kürzungsobergrenze des kompakten Verlaufs zurück, sofern der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.toolTitles` gibt kurze Zweckbezeichnungen für Tool-Aufrufe zurück, die in der Control UI dargestellt werden (gebündelt, maximal 24 Elemente mit begrenzten Eingaben). Die Funktion wird über `gateway.controlUi.toolTitles` aktiviert (standardmäßig deaktiviert); deaktivierte Gateways beantworten `{ titles: {}, disabled: true }` ohne Modellaufruf, damit Clients keine weiteren Anfragen stellen. Wenn die Funktion aktiviert ist, verwenden die Bezeichnungen das standardmäßige Utility-Modell-Routing: ein explizit konfiguriertes `utilityModel` (eine Betreiberentscheidung, die wie alle Utility-Aufgaben begrenzte Aufgabeninhalte an den ausgewählten Provider senden kann), andernfalls die deklarierte Standardvorgabe des Sitzungs-Providers für kleine Modelle, sodass nicht implizit ein neues Übertragungsziel entsteht; ein leeres `utilityModel` deaktiviert sie vollständig. Die Bezeichnungen greifen niemals auf das primäre Modell zurück. Ergebnisse werden in der Agent-bezogenen Statusdatenbank nach Tool-Name + Eingabe zwischengespeichert, sodass wiederholte Ansichten dieselben Aufrufe niemals erneut in Rechnung stellen.
    - `chat.send` akzeptiert ein einmaliges `fastMode: "auto"`, um den schnellen Modus für Modellaufrufe zu verwenden, die vor dem automatischen Grenzwert gestartet werden, und spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe anschließend ohne schnellen Modus zu starten. Der Grenzwert beträgt standardmäßig 60 Sekunden (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) und kann mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` pro Modell konfiguriert werden. Ein `chat.send`-Aufrufer kann ein einmaliges `fastAutoOnSeconds` übergeben, um den Grenzwert für diese Anfrage zu überschreiben. Übergeben Sie `queueMode` (`steer`, `followup`, `collect` oder `interrupt`), um den gespeicherten Warteschlangenmodus nur für diese Anfrage zu überschreiben; explizite Steuerungsaktionen der Control UI verwenden `queueMode: "steer"`. Interaktive Clients können `expectedLeafEntryId` mit dem aktiven Blatt des angezeigten Transkript-Branches oder `null` für ein maßgebliches leeres Transkript übergeben; das Gateway lehnt das Senden mit `details.reason: "active-leaf-changed"` ab, wenn zuvor ein anderer Client den Branch gewechselt hat.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.setupCode` erstellt einen Einrichtungscode für Mobilgeräte und standardmäßig eine PNG-QR-Daten-URL. Dies erfordert `operator.admin` und wird absichtlich nicht in der angekündigten Discovery aufgeführt. Das Ergebnis enthält `setupCode`, das optionale `qrDataUrl`, `gatewayUrl`, die nicht geheime `auth`-Bezeichnung und `urlSource`.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Datensätze zur Gerätekopplung.
    - `device.pair.rename` weist eine Betreiberbezeichnung (`{ deviceId, label }`) zu, die gegenüber dem vom Client gemeldeten Anzeigenamen bevorzugt wird und eine Gerätereparatur oder erneute Genehmigung überdauert.
    - `device.token.rotate` rotiert ein Token eines gekoppelten Geräts innerhalb der Grenzen seiner genehmigten Rolle und des Aufruferbereichs.
    - `device.token.revoke` widerruft ein Token eines gekoppelten Geräts innerhalb der Grenzen seiner genehmigten Rolle und des Aufruferbereichs.

    Der Einrichtungscode enthält einen kurzlebigen Bootstrap-Berechtigungsnachweis. Clients dürfen ihn über den Kopplungsvorgang hinaus weder
    protokollieren noch persistieren.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` und `node.pair.remove` decken Genehmigungen für Node-Funktionen ab. `node.pair.request` und `node.pair.verify` wurden 2026.7 zusammen mit dem eigenständigen Speicher für Node-Kopplungen entfernt; ausstehende Anfragen werden vom Gateway bei Node-Verbindungen erstellt.
    - `node.list` und `node.describe` geben den Status bekannter/verbundener Nodes zurück.
    - `node.rename` aktualisiert die Bezeichnung eines gekoppelten Nodes.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis einer Aufrufanfrage zurück.
    - `mcp.tools.call.v1` ist der Headless-Node-Host-Befehl zum Aufrufen eines konfigurierten Node-lokalen MCP-Tools. Er wird über `node.invoke` übertragen, erfordert, dass der Node den Befehl deklariert, und unterliegt weiterhin der Kopplungsgenehmigung und `gateway.nodes.commands.deny`.
    - `node.event` überträgt vom Node stammende Ereignisse zurück an das Gateway.
    - `node.pluginTools.update` ist der einzige Veröffentlichungspfad zum Ersetzen der für den Agent sichtbaren Plugin-/MCP-Tool-Deskriptoren des verbundenen Nodes; `connect`-Parameter übertragen sie nicht.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline befindliche/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `approval.history` gibt die neuesten zuerst sortierten, 30 Tage lang aufbewahrten abschließenden Genehmigungen für Ausführungs-, Plugin- und System-Agent-Anfragen zurück (Geltungsbereich `operator.approvals`). Die Methode unterstützt Cursor-Paginierung sowie einen optionalen Artfilter; ausstehende Genehmigungen sind keine Verlaufseinträge.
    - `approval.get` und `approval.resolve` sind die artunabhängigen dauerhaften Genehmigungsmethoden (Geltungsbereich `operator.approvals`). `approval.get` gibt eine bereinigte Projektion einer ausstehenden oder aufbewahrten abschließenden Genehmigung mit einer stabilen `urlPath` zurück; `approval.resolve` akzeptiert die kanonische Genehmigungs-ID, eine explizite `kind` und eine Entscheidung, wendet eine Auflösung nach dem Prinzip „erste Antwort gewinnt“ an und gibt stets das aufgezeichnete kanonische Ergebnis zurück.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Ausführungsgenehmigungsanfragen sowie das Nachschlagen und erneute Abspielen ausstehender Genehmigungen ab. Sie sind Adapter an der Protokollgrenze über derselben dauerhaften Genehmigungsregistrierung.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Ausführungsgenehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei einer Zeitüberschreitung).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Richtlinien-Snapshots für Gateway-Ausführungsgenehmigungen.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Richtlinie für Ausführungsgenehmigungen über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Control-UI-Befehle">
    - `ui.command` ermöglicht einem `operator.write`-Aufrufer, typisierte Layout- und Navigationsbefehle an verbundene Control-UI-Clients zu senden, die die Fähigkeit `ui-commands` bekannt geben.
    - Die Befehle decken das Teilen, Schließen und Fokussieren von Bereichen, die Sichtbarkeit der Seitenleiste, die Sichtbarkeit und Andockposition des Terminal-/Browser-Bereichs sowie die Sitzungsnavigation ab.
    - Protokoll v1 verteilt Befehle absichtlich an jede verbundene, geeignete Control UI. Wenn keine verbunden ist, schlägt die Anfrage mit `UNAVAILABLE` fehl, statt eine Änderung des Layouts vorzutäuschen.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Werkzeuge">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Einspeisung von Aktivierungstext; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run` und `cron.runs` verwalten geplante Arbeiten.
    - `cron.run` bleibt ein RPC im Einreihungsstil für manuelle Ausführungen. Clients, die eine Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` abfragen.
    - `cron.runs` akzeptiert einen optionalen, nicht leeren `runId`-Filter, damit Clients einer einzelnen eingereihten manuellen Ausführung folgen können, ohne mit anderen Verlaufseinträgen desselben Auftrags in Konflikt zu geraten.
    - Skills und Werkzeuge: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Siehe unten [Hilfsmethoden für Bediener](#operator-helper-methods).

  </Accordion>
</AccordionGroup>

### Allgemeine Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere reine Transkript-Chat-
  Ereignisse. In Protokoll v4 enthalten Delta-Nutzdaten `deltaText`; `message` bleibt
  der kumulative Assistenten-Snapshot. Ersetzungen, die kein Präfix betreffen, setzen
  `replace=true` und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation`, `session.tool`: Aktualisierungen des Transkripts, laufender
  Sitzungsvorgänge und des Ereignisstroms für eine abonnierte Sitzung.
- `session.approval`: bereinigte maßgebliche Daten zu ausstehenden und abschließenden Genehmigungen für einen
  ausdrücklich angemeldeten Abonnenten der exakten Sitzung. Untergeordnete Genehmigungen verwenden die
  persistierte Zielgruppe des Vorfahren; Ereignisse verändern niemals Transkripte und aktivieren keine Agenten.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des Systemanwesenheits-Snapshots.
- `tick`: regelmäßiges Keepalive-/Verfügbarkeitssignal.
- `health`: Aktualisierung des Gateway-Zustands-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstroms.
- `cron`: Änderungsereignis einer Cron-Ausführung/eines Cron-Auftrags.
- `shutdown`: Benachrichtigung über das Herunterfahren des Gateways.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus der Node-Kopplung.
- `node.invoke.request`: Übertragung einer Node-Aufrufanfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration des Aktivierungswort-Auslösers wurde geändert.
- `config.changed`: Ein Konfigurationsschreibvorgang wurde persistiert (die Nutzdaten enthalten den Konfigurationspfad,
  den neuen Snapshot-Hash und einen Zeitstempel – niemals Konfigurationsinhalte). Auf den Lese-
  Geltungsbereich für Bediener beschränkt; Clients aktualisieren über `config.get`.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Ausführungs-
  genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-
  Genehmigung.

### Node-Hilfsmethoden

Nodes können `skills.bins` aufrufen, um die aktuelle Liste ausführbarer Skill-Dateien
für Prüfungen der automatischen Zulassung abzurufen.

## Audit-Ledger-RPC

`audit.activity.list` bietet Bediener-Clients eine stabile, nach den neuesten Einträgen zuerst sortierte Ansicht der Lebenszyklusmetadaten von Agenten-
ausführungen, Werkzeugaktionen und optional erfassten Nachrichten. Die Methode erfordert
`operator.read`. Abfragen schließen Datensätze aus, die älter als 30 Tage sind, und das gemeinsam genutzte
SQLite-Ledger ist auf 100.000 Datensätze begrenzt. Abgelaufene Zeilen werden beim
Start des Gateways, bei der stündlichen Wartung und bei späteren Schreibvorgängen gelöscht. Informationen zum
Datenmodell und zur Datenschutzsemantik finden Sie unter [Audit-Verlauf](/de/gateway/audit).

- Parameter: optional exakte `agentId`, `sessionKey` oder `runId`; optionale `kind`
  (`"agent_run"`, `"tool_action"` oder `"message"`); optionale `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` oder `"unknown"`); optionale Nachrichten-`direction` (`"inbound"` oder
  `"outbound"`) und exakte `channel`; optionale inklusive Unix-Millisekunden-Grenzen `after` / `before`;
  optionale `limit` von `1` bis `500`; und optionale
  Zeichenfolge `cursor` von der vorherigen Seite.
- Ergebnis: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Die benannte V1-Ergebnis-Union besitzt separate Schemas für Agentenausführungen, Werkzeugaktionen, eingehende Nachrichten
und ausgehende Nachrichten. Der Diskriminator `eventType` ist jeweils
`agent_run`, `tool_action`, `inbound_message` oder `outbound_message`; `kind` und die Nachrichten-
`direction` bleiben für Filterung und Anzeige verfügbar. Jedes Ereignis besitzt eine ganzzahlige
`schemaVersion: 1`. Nachrichtenidentitätsreferenzen verwenden das exakte
Format `hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; die Akteur-ID eines Kanalsenders
verwendet dasselbe Format.

Alle Varianten erfordern `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` und
`redaction`. Die Variantenfelder sind:

| `eventType`        | Erforderliche Felder                                               | Optionale Felder                                                                                                                 |
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

Abschlussfelder sind miteinander korreliert und nicht unabhängig optional:

| Variante          | Abschlusszuordnung                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agentenausführung        | `started` besitzt keine `errorCode`; jeder abgeschlossene Status, der keinen Erfolg darstellt, erfordert seinen entsprechenden `run_*`-Code.                                                                 |
| Werkzeugaktion      | `started` und erfolgreich besitzen keine `errorCode`; jeder andere abgeschlossene Status erfordert seinen entsprechenden `tool_*`-Code.                                                       |
| Eingehende Nachricht  | erfolgreich = `completed`; blockiert = `skipped`; fehlgeschlagen = `failed` plus `message_processing_failed`. `reasonCode` muss, sofern vorhanden, zu dieser Abschlussfamilie gehören. |
| Ausgehende Nachricht | erfolgreich = `sent`; blockiert = `suppressed` plus `reasonCode`; fehlgeschlagen = `failed` plus `errorCode` und `failureStage`; unbekannt = `unknown` plus `failureStage`.      |

Jedes Aktivitätsereignis enthält eine stabile Ereignis-ID, eine monoton steigende Ledger-Sequenz,
eine Quellereignissequenz, einen Zeitstempel, einen Akteur, eine Aktion, einen Status, eine ganzzahlige
`schemaVersion: 1` und `redaction: "metadata_only"`. Ausführungs- und Werkzeugdatensätze
erfordern die Herkunft von Agent und Ausführung und können eine Sitzungsh Herkunft enthalten. Nachrichten-
datensätze können Agenten- und Ausführungs-IDs enthalten, enthalten jedoch absichtlich niemals
`sessionKey` oder `sessionId`; der Abfragefilter `sessionKey` gilt daher
nur für Ausführungs- und Werkzeugzeilen. Werkzeugereignisse können eine Werkzeugaufruf-ID und einen Werkzeugnamen enthalten.

Nachrichtendatensätze verwenden `message.inbound.processed` oder
`message.outbound.finished` und fügen Richtung, Kanal, Konversationsart,
normalisiertes Ergebnis sowie optional Zustellungsart, Fehlerphase, Dauer,
Ergebnisanzahl, Ursachencode und installationslokale, schlüsselbasierte
Konto-/Konversations-/Nachrichten-/Zielpseudonyme hinzu. Diese Pseudonyme erleichtern
die Korrelation, stellen jedoch keine Anonymisierung dar: Die Zustandsdatenbank enthält ihren Schlüssel,
RPC- und CLI-Exporte hingegen nicht. Das Ledger speichert keine Prompts, Nachrichteninhalte,
Tool-Argumente, Tool-Ergebnisse, Befehlsausgaben oder unbereinigten Fehlertexte.
Run-/Tool-Werte für `sessionKey` bleiben unveränderte Korrelationsmetadaten und können
Plattformkonto- oder Gegenstellen-IDs enthalten; Nachrichtendatensätze enthalten keine Sitzungsschlüssel.

Bei eingehenden Zeilen misst `durationMs` den Core-Dispatch bis zu seinem Abschluss und
`resultCount` zählt finalisierte, in die Warteschlange eingereihte Tool-, Block- und Antwort-Payloads. Bei
ausgehenden Zeilen umfasst `durationMs` die Zustellungsverantwortung bis zur Bestätigung,
Dead-Letter-Behandlung oder Abstimmung (einschließlich Wartezeit in der Warteschlange), und `resultCount`
zählt identifizierte physische Übertragungen an die Plattform. `deliveryKind` beschreibt, sofern vorhanden,
den effektiven Payload nach Hooks und Rendering; unterdrückte oder hinsichtlich eines Absturzes
mehrdeutige Zeilen enthalten ihn nicht.

Die derzeitige Nachrichtenabdeckung umfasst akzeptierte eingehende Nachrichten, die den Core-
Dispatch erreichen, einschließlich der Core-Ergebnisse für Duplikate und Abschlüsse. Für ausgehende Nachrichten wird
eine Abschlusszeile pro ursprünglichem logischem Antwort-Payload geschrieben, der die gemeinsame dauerhafte
Zustellung erreicht; Chunking und Adapter-Fan-out werden in `resultCount` aggregiert. In die Warteschlange eingereihte,
wiederholbare oder mehrdeutige Übertragungen werden erst nach Bestätigung, Dead-Letter-Behandlung
oder Abstimmung aufgezeichnet. Plugin-lokale und direkte Übertragungspfade, die diese
gemeinsamen Grenzen umgehen, sind noch nicht abgedeckt. Die begrenzte Worker-Warteschlange arbeitet nach bestem Bemühen
und kann bei Fehlern oder Sättigung Datensätze verwerfen; daher ist diese Oberfläche kein
verlustfreies Compliance-Archiv.

Die Aufzeichnung ist standardmäßig aktiviert und wird über
[`audit.enabled`](/de/gateway/configuration-reference#audit) gesteuert. Die Nachrichtenaufzeichnung wird
separat durch `audit.messages` gesteuert und ist standardmäßig auf `"off"` gesetzt. Wenn
die Aufzeichnung deaktiviert ist, stellt `audit.activity.list` zuvor geschriebene Datensätze
weiterhin bereit, bis sie ablaufen.

Die ausgelieferten Schemas für `audit.list`-Anfrage, -Ergebnis und `AuditEvent` bleiben
unverändert und geben nur Datensätze zu Agent-Ausführungen und Tool-Aktionen zurück. Neue Operator-
Clients sollten `audit.activity.list` aufrufen, wenn der Gateway dies ankündigt. Ältere
Gateways können entweder `unknown method: audit.activity.list` oder, da
die Autorisierung in ausgelieferten Versionen vor der Methodensuche erfolgte, `missing scope:
operator.admin` für eine Anfrage mit Leseberechtigung melden. Behandeln Sie Letzteres nur dann als
nicht vorhandene Methode, wenn die Methode nicht angekündigt wurde. Ein Client darf anschließend `audit.list`
nur dann erneut versuchen, wenn seine Filter keine Unterstützung für Nachrichtenart, Richtung oder Kanal
erfordern.

Verwenden Sie [`openclaw audit`](/de/cli/audit) für Textabfragen und begrenzte JSON-Exporte.

## Task-Ledger-RPCs

Operator-Clients prüfen und beenden Datensätze zu Gateway-Hintergrundaufgaben über
die Task-Ledger-RPCs (`packages/gateway-protocol/src/schema/tasks.ts`). Diese
geben bereinigte Aufgabenzusammenfassungen zurück, keinen unveränderten Laufzeitstatus.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optional `agentId`, optional `sessionKey`, optional `limit` von `1` bis
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
    gibt an, ob die Laufzeitumgebung den Abbruch angenommen oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
Abschlusszusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agenten,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren den Kontext des Anfordernden und der Steuerung.

## Hilfsmethoden für Operatoren

- `commands.list` (`operator.read`) ruft das Laufzeit-Befehlsinventar für
  einen Agenten ab.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Arbeitsbereich des Agenten zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` verweist: `text` gibt
    das primäre Textbefehlstoken ohne das vorangestellte `/` zurück; `native` und der
    standardmäßige Pfad `both` geben Provider-spezifische native Namen zurück, sofern verfügbar.
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-spezifischen nativen Befehlsnamen, sofern
    einer vorhanden ist.
  - `provider` ist optional und wirkt sich nur auf die native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- `tools.catalog` (`operator.read`) ruft den Laufzeit-Toolkatalog für einen
  Agenten ab. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- `tools.effective` (`operator.read`) ruft das zur Laufzeit wirksame Tool-
  Inventar für eine Sitzung ab.
  - `sessionKey` ist erforderlich.
  - Der Gateway leitet den vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab,
    statt vom Aufrufer bereitgestellten Authentifizierungs- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, vom Server abgeleitete Projektion des aktiven
    Inventars, einschließlich Core-, Plugin-, Kanal- und bereits erkannter MCP-
    Server-Tools.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen aufgewärmten sitzungsbezogenen MCP-
    Katalog durch die endgültige Tool-Richtlinie projizieren, erstellt jedoch keine MCP-Laufzeitumgebungen,
    verbindet keine Transporte und gibt kein `tools/list` aus. Wenn kein passender aufgewärmter Katalog
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
  - Nur Eigentümern zugängliche Core-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    eine Eigentümer-/Administratoridentität (`operator.admin`), obwohl `tools.invoke` selbst
    `operator.write` ist.
  - Die Antwort ist eine SDK-orientierte Hülle mit `ok`, `toolName`, optionalem
    `output` und typisierten `error`-Feldern. Ablehnungen aufgrund von Genehmigungen oder Richtlinien geben
    `ok:false` im Payload zurück, statt die Gateway-Tool-Richtlinien-
    Pipeline zu umgehen.
- `skills.status` (`operator.read`) ruft das sichtbare Skills-Inventar für einen
  Agenten ab.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Arbeitsbereich des Agenten zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen
    und bereinigte Installationsoptionen, ohne unveränderte Geheimniswerte offenzulegen.
- `skills.search` und `skills.detail` (`operator.read`) geben ClawHub-
  Ermittlungsmetadaten zurück.
- `skills.upload.begin`, `skills.upload.chunk` und `skills.upload.commit`
  (`operator.admin`) stellen vor der Installation ein privates Skills-Archiv bereit. Dies
  ist ein separater Administrator-Upload-Pfad für vertrauenswürdige Clients, nicht der normale ClawHub-
  Installationsablauf für Skills, und ist standardmäßig deaktiviert, sofern nicht
  `skills.install.allowUploadedArchives` aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakten dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` überprüft die endgültige Größe und
    SHA-256. Der Commit schließt lediglich den Upload ab; er installiert den Skill nicht.
  - Hochgeladene Skills-Archive sind ZIP-Archive, die einen `SKILL.md`-Stamm enthalten. Der
    interne Verzeichnisname des Archivs bestimmt niemals das Installationsziel.
- `skills.install` (`operator.admin`) hat drei Modi:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skills-Ordner im Verzeichnis `skills/` des Standard-Arbeitsbereichs des Agenten.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen abgeschlossenen Upload im Verzeichnis `skills/<slug>`
    des Standard-Arbeitsbereichs des Agenten. Slug und Force-Wert müssen mit der
    ursprünglichen `skills.upload.begin`-Anfrage übereinstimmen. Die Anfrage wird abgelehnt, sofern nicht
    `skills.install.allowUploadedArchives` aktiviert ist; die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installationsmodus: `{ name, installId, timeoutMs? }` führt eine deklarierte
    `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus. Ältere Clients können
    weiterhin `dangerouslyForceUnsafeInstall` senden; dieses Feld ist veraltet,
    wird nur zur Protokollkompatibilität akzeptiert und ignoriert. Verwenden Sie
    `security.installPolicy` für operatorgesteuerte Installationsentscheidungen.
- `skills.update` (`operator.admin`) hat zwei Modi:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    Standard-Arbeitsbereich des Agenten.
  - Der Konfigurationsmodus ändert `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen Parameter `view`
(`src/agents/model-catalog-visibility.ts`):

- Weggelassen oder `"default"`: Wenn `agents.defaults.modelPolicy.allow` konfiguriert ist, entspricht die
  Antwort dem zulässigen Katalog, einschließlich dynamisch erkannter Modelle
  für `provider/*`-Einträge. Andernfalls entspricht die Antwort dem vollständigen Gateway-
  Katalog.
- `"configured"`: Verhalten mit einer für die Auswahl geeigneten Größe. Wenn `agents.defaults.modelPolicy.allow`
  konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-bezogener Erkennung für
  `provider/*`-Einträge. Ohne Positivliste verwendet die Antwort explizite
  `models.providers.<provider>.models`-Einträge und greift nur dann auf den vollständigen
  Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"provider-config"`: quellseitig erstelltes `models.providers.*.models`-Inventar,
  unabhängig von Auswahl-Positivlisten. Zeilen enthalten öffentliche Modellfähigkeiten und
  routingbezogene Verfügbarkeit, lassen jedoch Provider-Endpunkte, Authentifizierungsmaterial und
  die Konfiguration von Laufzeitanfragen weg.
- `"all"`: vollständiger Gateway-Katalog unter Umgehung von `agents.defaults.modelPolicy.allow`. Verwenden Sie ihn für
  Diagnose-/Erkennungsoberflächen, nicht für normale Modellauswahlfelder.

## Ausführungsgenehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung erfordert, sendet das Gateway
  `exec.approval.requested` an alle Clients.
- Operator-Clients führen die Auflösung durch, indem sie `exec.approval.resolve` aufrufen (erfordert
  `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan`
  enthalten (kanonische `argv`-/`cwd`-/`rawCommand`-/Sitzungsmetadaten). Anfragen ohne
  `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe denselben
  kanonischen `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen der Vorbereitung und der endgültigen genehmigten `system.run`-Weiterleitung verändert,
  lehnt das Gateway die Ausführung ab, anstatt der veränderten Nutzlast zu vertrauen.

## Fallback für die Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um eine ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` (der Standardwert) behält das strikte Verhalten bei: Nicht auflösbare oder
  ausschließlich interne Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` ermöglicht den Fallback auf eine ausschließlich sitzungsbezogene Ausführung, wenn keine
  extern zustellbare Route aufgelöst werden kann (beispielsweise bei internen/Webchat-
  Sitzungen oder mehrdeutigen Mehrkanalkonfigurationen).
- Endgültige `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn eine Zustellung
  angefordert wurde, und verwenden dabei dieselben Status `sent`, `suppressed`, `partial_failed` und
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
  dürfen das N-1-Node-Protokoll verwenden (derzeit v3). Einfache Neustartprüfungen verwenden
  dasselbe N-1-Fenster. Geräteauthentifizierung, Kopplung, Geltungsbereiche, Befehlsrichtlinie und Exec-
  Genehmigungen bleiben von diesem Kompatibilitätsfenster unverändert. Plugin-eigene Node-
  Funktionen und Befehle werden zurückgehalten, bis die Node auf das aktuelle
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
| Timeout für Präauthentifizierung/Verbindungs-Challenge | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (die Umgebungsvariable `OPENCLAW_HANDSHAKE_TIMEOUT_MS` kann das gekoppelte Server-/Client-Budget erhöhen) |
| Anfangsverzögerung für erneute Verbindungen | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Maximale Verzögerung für erneute Verbindungen | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Begrenzung für schnelle Wiederholungsversuche nach dem Schließen aufgrund eines Gerätetokens | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Kulanzfrist für erzwungenes Beenden vor `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Standard-Timeout für `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Standardmäßiges Tick-Intervall (vor `hello-ok`)    | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Schließen bei Tick-Timeout                | Code `4000`, wenn die Stille `tickIntervalMs * 2` überschreitet | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Der Server gibt die effektiven Werte für `policy.tickIntervalMs`,
`policy.maxPayload` und `policy.maxBufferedBytes` in `hello-ok` bekannt; Clients
sollten diese Werte anstelle der Standardwerte vor dem Handshake berücksichtigen.

Der Referenz-Client überlässt endlichen Anfragen ihre konfigurierte Frist, wenn
jede ausstehende Anfrage eine besitzt. Eine `expectFinal`-Anfrage ohne endlichen
`timeoutMs`, eine Anfrage mit `timeoutMs: null` oder eine Mischung aus endlichen und
unbegrenzten Anfragen hält den Tick-Watchdog aktiv. Wenn eingehende Ereignisse und
Antworten länger als der Tick-Timeout-Schwellenwert ausbleiben, schließt der Client den
Socket mit Code `4000`, lehnt jede ausstehende Anfrage ab und stellt die Verbindung erneut her. Er
wiederholt abgelehnte Anfragen nach der erneuten Verbindung nicht.

## Authentifizierung

- Die Gateway-Authentifizierung mit gemeinsamem Geheimnis verwendet je nach konfiguriertem
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`) entweder `connect.params.auth.token` oder
  `connect.params.auth.password`.
- Identitätstragende Modi wie Tailscale Serve (`gateway.auth.allowTailscale: true`)
  oder `gateway.auth.mode: "trusted-proxy"` ohne Loopback erfüllen die Authentifizierungsprüfung
  beim Verbindungsaufbau anhand der Anfrage-Header statt anhand von `connect.params.auth.*`.
- Beim privaten Ingress überspringt `gateway.auth.mode: "none"` die
  Verbindungsauthentifizierung mit gemeinsamem Geheimnis vollständig; stellen Sie
  diesen Modus nicht über einen öffentlichen/nicht vertrauenswürdigen Ingress bereit.
- Nach dem Pairing stellt das Gateway ein auf Verbindungsrolle und
  Berechtigungsbereiche beschränktes Geräte-Token aus, das in `hello-ok.auth.deviceToken`
  zurückgegeben wird. Clients sollten es nach jeder erfolgreichen Verbindung dauerhaft speichern.
- Bei einer erneuten Verbindung mit diesem gespeicherten Geräte-Token sollte
  auch der für dieses Token gespeicherte genehmigte Satz von Berechtigungsbereichen
  wiederverwendet werden. Dadurch bleiben bereits gewährte Lese-, Prüf- und
  Statuszugriffe erhalten, und erneute Verbindungen werden nicht unbemerkt auf einen
  engeren impliziten, ausschließlich administrativen Berechtigungsbereich reduziert.
- Clientseitige Zusammenstellung der Authentifizierung beim Verbindungsaufbau
  (`selectConnectAuth` in `packages/gateway-client/src/client.ts`):
  - `auth.password` ist davon unabhängig und wird immer weitergeleitet, wenn es festgelegt ist.
  - `auth.token` wird in folgender Prioritätsreihenfolge befüllt: zuerst
    ein explizites gemeinsam verwendetes Token, dann ein explizites `deviceToken`
    und anschließend ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keine der vorstehenden
    Möglichkeiten `auth.token` aufgelöst hat. Ein gemeinsam verwendetes Token
    oder ein beliebiges aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Heraufstufung eines gespeicherten Geräte-Tokens beim einmaligen
    Wiederholungsversuch mit `AUTH_TOKEN_MISMATCH` ist ausschließlich auf vertrauenswürdige
    Endpunkte beschränkt: Loopback oder `wss://` mit angeheftetem
    `tlsFingerprint`. Öffentliches `wss://` ohne Anheftung ist nicht zulässig.
- Der integrierte Bootstrap über Einrichtungscode gibt den primären Node
  `hello-ok.auth.deviceToken` sowie ein beschränktes Operator-Token in
  `hello-ok.auth.deviceTokens` für die vertrauenswürdige Übergabe an Mobilgeräte zurück.
  Das Operator-Token enthält `operator.talk.secrets` für native Lesezugriffe auf die
  Talk-Konfiguration, schließt jedoch Berechtigungsbereiche für Pairing-Änderungen
  und `operator.admin` aus.
- Während ein Bootstrap über einen Einrichtungscode außerhalb der Basiskonfiguration
  auf Genehmigung wartet, enthalten die Details von `PAIRING_REQUIRED`
  `recommendedNextStep: "wait_then_retry"`, `retryable: true` und `pauseReconnect: false`. Stellen Sie
  weiterhin mit demselben Bootstrap-Token Verbindungen her, bis die Anfrage
  genehmigt wird oder das Token ungültig wird.
- Speichern Sie `hello-ok.auth.deviceTokens` nur dauerhaft, wenn für die Verbindung
  Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport wie
  `wss://` oder lokales Pairing bzw. Pairing über Loopback verwendet wurde.
- Wenn ein Client ein explizites `deviceToken` oder ein explizites
  `scopes` bereitstellt, bleibt dieser vom Aufrufer angeforderte Satz von
  Berechtigungsbereichen maßgeblich; zwischengespeicherte Berechtigungsbereiche werden
  nur wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Geräte-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert bzw. widerrufen werden (erfordert `operator.pairing`).
  Das Rotieren oder Widerrufen eines Nodes oder einer anderen Nicht-Operator-Rolle
  erfordert außerdem `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Das Ersatz-Bearer-Token
  wird nur bei Aufrufen desselben Geräts zurückgegeben, die bereits mit diesem
  Geräte-Token authentifiziert wurden, damit Clients, die ausschließlich Tokens
  verwenden, ihren Ersatz vor dem erneuten Verbindungsaufbau dauerhaft speichern
  können. Bei Rotationen mit gemeinsamem Geheimnis oder Administratorrechten wird
  das Bearer-Token nicht zurückgegeben.
- Ausstellung, Rotation und Widerruf von Tokens bleiben auf den genehmigten
  Rollensatz beschränkt, der im Pairing-Eintrag des jeweiligen Geräts verzeichnet
  ist; Token-Änderungen können keine Geräterolle erweitern oder adressieren, die
  durch die Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung auf das eigene
  Gerät beschränkt, sofern der Aufrufer nicht zusätzlich über `operator.admin`
  verfügt: Aufrufer ohne Administratorrechte können nur das Operator-Token ihres
  eigenen Geräteeintrags verwalten. Die Verwaltung von Node- und anderen
  Nicht-Operator-Tokens ist ausschließlich Administratoren vorbehalten, auch für
  das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den
  Berechtigungsbereichssatz des Operator-Zieltokens anhand der aktuellen
  Sitzungsberechtigungsbereiche des Aufrufers. Aufrufer ohne Administratorrechte
  können kein umfassenderes Operator-Token rotieren oder widerrufen, als sie selbst besitzen.
- Authentifizierungsfehler enthalten `error.details.code` sowie Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolescher Wert)
  - `error.details.recommendedNextStep`: entweder `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry` oder `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Clientverhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen einzelnen beschränkten Wiederholungsversuch
    mit einem zwischengespeicherten gerätespezifischen Token unternehmen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, beenden Sie automatische
    Wiederverbindungsschleifen und zeigen Sie Hinweise zu erforderlichen
    Operator-Maßnahmen an.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber
  die angeforderte Rolle bzw. die angeforderten Berechtigungsbereiche nicht abdeckt.
  Stellen Sie dies nicht als ungültiges Token dar; fordern Sie den Operator auf,
  das Pairing erneut durchzuführen oder den engeren bzw. umfassenderen
  Berechtigungsbereichsvertrag zu genehmigen.

## Geräteidentität und Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten,
  die aus dem Fingerabdruck eines Schlüsselpaars abgeleitet ist.
- Gateways stellen Tokens pro Gerät und Rolle aus.
- Für neue Geräte-IDs sind Pairing-Genehmigungen erforderlich, sofern die
  automatische lokale Genehmigung nicht aktiviert ist.
- Die automatische Pairing-Genehmigung ist auf direkte lokale
  Loopback-Verbindungen ausgerichtet.
- OpenClaw verfügt außerdem über einen eng begrenzten lokalen
  Selbstverbindungspfad für Backend/Container bei vertrauenswürdigen Hilfsabläufen
  mit gemeinsamem Geheimnis.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden für das Pairing
  weiterhin als remote behandelt und müssen genehmigt werden.
- WS-Clients schließen während `connect` normalerweise die Identität
  `device` ein (Operator + Node). Die einzigen Operator-Ausnahmen ohne
  Gerät sind explizite Vertrauenspfade:
  - erfolgreiche Operator-Authentifizierung der Control UI über `gateway.auth.mode: "trusted-proxy"`.
  - Backend-RPCs über direkte Loopback-Verbindungen mit `gateway-client` auf
    dem reservierten internen Hilfspfad.
- Das Weglassen der Geräteidentität hat Auswirkungen auf die Berechtigungsbereiche.
  Wenn eine Operator-Verbindung ohne Gerät über einen expliziten Vertrauenspfad
  zugelassen wird, setzt OpenClaw selbst deklarierte Berechtigungsbereiche weiterhin
  auf eine leere Menge zurück, sofern dieser Pfad keine benannte Ausnahme zur
  Beibehaltung von Berechtigungsbereichen aufweist. Methoden mit
  Berechtigungsbereichsprüfung schlagen dann mit `missing scope` fehl.
- Der reservierte Backend-Hilfspfad über direkte Loopback-Verbindungen mit
  `gateway-client` behält Berechtigungsbereiche nur für interne lokale
  Control-Plane-RPCs bei; benutzerdefinierte Backend-IDs erhalten diese Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce
  `connect.challenge` signieren.

### Migrationsdiagnose für die Geräteauthentifizierung

Für ältere Clients, die noch das Signaturverhalten vor Einführung der Challenge
verwenden, gibt `connect` unter `error.details.code` Detailcodes vom Typ
`DEVICE_AUTH_*` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Der Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Der Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Die Signaturnutzlast entspricht nicht der v2-Nutzlast. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Der signierte Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` entspricht nicht dem Fingerabdruck des öffentlichen Schlüssels. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des öffentlichen Schlüssels fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie die v2-Nutzlast, die die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Die bevorzugte Signaturnutzlast ist `v3`
  (`buildDeviceAuthPayloadV3` in `packages/gateway-client/src/device-auth.ts`),
  die zusätzlich zu den Feldern für Gerät/Client/Rolle/Berechtigungsbereiche/Token/Nonce
  auch `platform` und `deviceFamily` bindet.
- Ältere `v2`-Signaturen werden aus Kompatibilitätsgründen
  weiterhin akzeptiert, die Metadatenanheftung gekoppelter Geräte steuert jedoch
  weiterhin die Befehlsrichtlinie bei der erneuten Verbindung.

## TLS und Anheftung

- TLS wird für WS-Verbindungen unterstützt (Konfiguration `gateway.tls`).
- Clients können den Fingerabdruck des Gateway-Zertifikats optional über
  `gateway.remote.tlsFingerprint` oder per CLI mit `--tls-fingerprint` anheften.

## Umfang

Dieses Protokoll stellt die vollständige Gateway-API bereit: Status, Kanäle,
Modelle, Chat, Agent, Sitzungen, Nodes, Genehmigungen und mehr. Der genaue
Funktionsumfang wird durch die TypeBox-Schemas definiert, die aus
`packages/gateway-protocol/src/schema.ts` erneut exportiert werden.

## Verwandte Themen

- [Gateway-Client erstellen](https://docs.openclaw.ai/gateway/clients)
- [OpenClaw einbetten](https://docs.openclaw.ai/gateway/embedding)
- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Betriebshandbuch](/de/gateway)
