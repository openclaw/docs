---
read_when:
    - Gateway-WS-Clients implementieren oder aktualisieren
    - Debuggen von Protokollinkompatibilitäten oder Verbindungsfehlern
    - Protokollschema/-modelle regenerieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-04T17:53:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Steuerungsebene + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS/Android-Nodes, headless
Nodes) verbinden sich per WebSocket und deklarieren ihre **Rolle** + ihren **Geltungsbereich** beim
Handshake.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Limits `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose erzeugen
  zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor der Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse speichern
  Größen, Limits, Oberflächen und sichere Reason-Codes. Sie speichern nicht den Nachrichteninhalt,
  Attachment-Inhalte, den rohen Frame-Body, Tokens, Cookies oder Secret-Werte.

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

Gateway → Client:

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

Während der Gateway noch Start-Sidecars abschließt, kann die `connect`-Anfrage
einen erneut versuchbaren `UNAVAILABLE`-Fehler mit `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` zurückgeben. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle vom Schema
(`packages/gateway-protocol/src/schema/frames.ts`) vorgeschrieben. `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle bzw. die ausgehandelten Geltungsbereiche. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen wie `canvas` bereichsgebundenen gehosteten URLs zu.

Bereichsgebundene Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Das experimentelle Canvas-Plugin-Refactoring
unterstützt nicht den veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh`; aktuelle native Clients und
Gateways müssen Plugin-Oberflächen verwenden.

Wenn kein Device-Token ausgestellt wird, meldet `hello-ok.auth` die ausgehandelten
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
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen weglassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/Passwort authentifizieren. Dieser Pfad ist
für interne Steuerungsebenen-RPCs reserviert und verhindert, dass veraltete CLI-/Device-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
Browser-Origin-Clients, Node-Clients und explizite Device-Token-/Device-Identity-
Clients verwenden weiterhin die normalen Pairing- und Scope-Upgrade-Prüfungen.

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

Der integrierte QR-/Setup-Code-Bootstrap ist ein frischer mobiler Übergabepfad. Eine erfolgreiche
Baseline-Setup-Code-Verbindung gibt ein primäres Node-Token plus ein begrenztes
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

Die Operator-Übergabe ist bewusst begrenzt, damit das QR-Onboarding die
mobile Operator-Schleife starten und die native Einrichtung abschließen kann, ohne Pairing-
Mutations-Scopes oder `operator.admin` zu gewähren. Sie enthält `operator.talk.secrets`, damit der
native Client die nach dem Bootstrap benötigte Talk-Konfiguration lesen kann. Umfassenderer
Pairing- und Admin-Zugriff erfordert einen separaten genehmigten Operator-Pairing- oder Token-
Flow. Clients sollten
`hello-ok.auth.deviceTokens` nur dann persistieren,
wenn die Verbindung Bootstrap-Authentifizierung über vertrauenswürdigen Transport wie `wss://` oder
Loopback-/lokales Pairing verwendet hat.

### Node-Beispiel

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## Framing

- **Anfrage**: `{type:"req", id, method, params}`
- **Antwort**: `{type:"res", id, ok, payload|error}`
- **Ereignis**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten erfordern **Idempotenzschlüssel** (siehe Schema).

## Rollen + Geltungsbereiche

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und die Semantik gemeinsamer Secrets
finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Client der Steuerungsebene (CLI/UI/Automatisierung).
- `node` = Capability-Host (Kamera/Bildschirm/Canvas/system.run).

### Geltungsbereiche (Operator)

Gängige Geltungsbereiche:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).
Wenn Secrets enthalten sind, sollten Clients die aktive Zugangsdatenkonfiguration des Talk-Providers
aus `talk.resolved.config.apiKey` lesen; `talk.providers.<id>.apiKey`
bleibt quellförmig und kann ein SecretRef-Objekt oder ein redigierter String sein.

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Schranke. Einige über
`chat.send` erreichte Slash-Befehle wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Beispielsweise erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum
Basis-Methoden-Scope eine weitere Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Befehle/Berechtigungen (Node)

Nodes deklarieren Capability-Ansprüche zum Verbindungszeitpunkt:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Befehls-Allowlist für Invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Der Gateway behandelt diese als **Ansprüche** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Device-Identität geschlüsselt sind.
- Präsenzeinträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Device anzeigen können,
  auch wenn es sowohl als **operator** als auch als **node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit Reason `connect`; gekoppelte Nodes können außerdem
  dauerhafte Hintergrundpräsenz melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Pairing-Metadaten aktualisiert.

### Hintergrund-Alive-Ereignis für Nodes

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um aufzuzeichnen, dass ein gekoppelte Node
während eines Hintergrund-Weckvorgangs aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom Gateway vor der Persistierung zu
`background` normalisiert. Das Ereignis ist nur für authentifizierte Node-
Device-Sitzungen dauerhaft; Device-lose oder nicht gekoppelte Sitzungen geben `handled: false` zurück.

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
bestätigten RPC behandeln, nicht als dauerhafte Präsenzpersistierung.

## Geltungsbereich für Broadcast-Ereignisse

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind scope-gesteuert, damit Pairing-begrenzte oder Node-only-Sitzungen keine Sitzungsinhalte passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Aufrufergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** sind je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` beschränkt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportgesundheit für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scope-gesteuert (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts auf diesem Socket eine monotone Reihenfolge bewahren, auch wenn verschiedene Clients unterschiedliche scope-gefilterte Teilmengen des Ereignisstreams sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen, begrenzten Diagnosestabilitäts-Recorder zurück. Er speichert Betriebsmetadaten wie Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Er speichert keine Chattexte, Webhook-Bodys, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodys, Tokens, Cookies oder geheimen Werte. Operator-Leseumfang ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Umfang einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Kopplungsabläufen verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswahlgeeignete konfigurierte Modelle (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents pro Provider zurück.
    - `usage.cost` gibt aggregierte Kostennutzungs-Zusammenfassungen für einen Datumsbereich zurück.
      Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Einbettungen für den aktiven Standard-Agenten-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Einbettungs-Provider möchte. Dreaming-fähige Clients können außerdem `{ "agentId": "agent-id" }` übergeben, um Statistiken des Dreaming-Speichers auf einen ausgewählten Agenten-Arbeitsbereich zu beschränken; wenn `agentId` weggelassen wird, bleibt der Fallback auf den Standard-Agenten erhalten und konfigurierte Dreaming-Arbeitsbereiche werden aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optionale Parameter `{ "agentId": "agent-id" }` für Dreaming-Ansichten/-Aktionen ausgewählter Agenten. Wenn `agentId` weggelassen wird, arbeiten sie im konfigurierten Standard-Agenten-Arbeitsbereich.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes Grounded-Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen
      Agenten oder `agentScope: "all"`, um konfigurierte Agenten zusammen aufzulisten.
    - `sessions.usage.timeseries` gibt Zeitreihen-Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Login-Hilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Flow für den aktuellen QR-fähigen Webkanal-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Login-Flow abgeschlossen ist, und startet bei Erfolg den Kanal.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Aktivierungswort-Auslöser zurück.
    - `voicewake.set` aktualisiert Aktivierungswort-Auslöser und sendet die Änderung.

  </Accordion>

  <Accordion title="Nachrichten und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellungen für kanal-, konto- und threadbezogene Sendungen außerhalb des Chat-Runners.
    - `logs.tail` gibt den konfigurierten Gateway-Dateiprotokollauszug mit Cursor-/Limit- und Maximalbyte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält kanonische Provider-IDs, Registry-Aliase, Beschriftungen, konfigurierten Zustand, ein optionales `ready`-Ergebnis auf Gruppenebene, offengelegte Modell-/Stimmen-IDs, kanonische Modi, Transporte, Brain-Strategien sowie Echtzeit-Audio-/Capability-Flags, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu ändern. Aktuelle Gateways setzen `ready`, nachdem die Laufzeit-Provider-Auswahl angewendet wurde; Clients sollten das Fehlen dieses Werts zur Kompatibilität mit älteren Gateways als nicht verifiziert behandeln.
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine vom Gateway verwaltete Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Für `stt-tts/managed-room` müssen Aufrufer mit `operator.write`, die `sessionKey` übergeben, auch `spawnedBy` für die bereichsgebundene Sichtbarkeit des Sitzungsschlüssels übergeben; die ungebundene Erstellung von `sessionKey` und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Sitzungstoken für einen verwalteten Raum, gibt bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse aus und gibt Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse ohne Klartexttoken oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt base64-codiertes PCM-Eingabeaudio an vom Gateway verwaltete Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus eines verwalteten Raums mit Ablehnung veralteter Turns, bevor der Zustand gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Dazwischenreden in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer vom Gateway verwalteten Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgabe, wenn ein finales Ergebnis folgt, oder `options: { suppressResponse: true }`, wenn das Tool-Ergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Assistentenantwort zu starten.
    - `talk.session.steer` sendet Sprachsteuerung für einen aktiven Lauf an eine vom Gateway verwaltete, agentengestützte Talk-Sitzung. Akzeptiert wird `{ sessionId, text, mode? }`, wobei `mode` `status`, `steer`, `cancel` oder `followup` ist; ein ausgelassener Modus wird aus dem gesprochenen Text klassifiziert.
    - `talk.session.close` schließt eine vom Gateway verwaltete Relay-, Transkriptions- oder verwaltete-Raum-Sitzung und gibt terminale Talk-Ereignisse aus.
    - `talk.mode` setzt/überträgt den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine clientverwaltete Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Konfiguration, Zugangsdaten, Anweisungen und Tool-Richtlinie verwaltet.
    - `talk.client.toolCall` ermöglicht clientverwalteten Echtzeit-Transporten, Provider-Tool-Aufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Lauf-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis übermitteln.
    - `talk.client.steer` sendet Sprachsteuerung für einen aktiven Lauf bei clientverwalteten Echtzeit-Transporten. Das Gateway löst den aktiven eingebetteten Lauf aus `sessionKey` auf und gibt statt stillschweigendem Verwerfen der Steuerung ein strukturiertes akzeptiert/abgelehnt-Ergebnis zurück.
    - `talk.event` ist der einzelne Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT/TTS-, verwaltete-Raum-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den aktivierten TTS-Zustand, den aktiven Provider, Fallback-Provider und den Zustand der Provider-Konfiguration zurück.
    - `tts.providers` gibt den sichtbaren TTS-Provider-Bestand zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungszustand um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Geheimnisse, Konfiguration, Aktualisierung und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Geheimniszustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst befehlszielbezogene Geheimniszuweisungen für einen bestimmten Befehls-/Zielsatz auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt eine teilweise Konfigurationsaktualisierung zusammen. Destruktive Array-
      Ersetzung erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays
      unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert + ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Konfigurationsschemanutzlast zurück, die von Control UI und CLI-Werkzeugen verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- und Kanalschemametadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Beschriftungen und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Platzhalter-, Array-Element- und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Nutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath`, optionales `reloadKind` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drill-down. `reloadKind` ist eines von `restart`, `hot` oder `none` und spiegelt den Gateway-Konfigurations-Neuladeplaner für den angeforderten Pfad wider. Lookup-Schemaknoten behalten die nutzerseitige Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindzusammenfassungen stellen `key`, den normalisierten `path`, `type`, `required`, `hasChildren`, optionales `reloadKind` sowie den passenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Aktualisierungsablauf aus und plant einen Neustart nur, wenn die Aktualisierung selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einschließen, damit der Start einen Folge-Agenten-Turn über die Neustart-Fortsetzungswarteschlange fortsetzt. Paketmanager-Aktualisierungen und überwachte Git-Checkout-Aktualisierungen aus der Steuerungsebene verwenden eine getrennte Übergabe an einen verwalteten Dienst, statt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgaben innerhalb des laufenden Gateways zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` sowie `handoff.command` zurück, wenn eine manuelle Shell-Aktualisierung erforderlich ist. Eine nicht verfügbare Übergabe bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Dienstidentität hat, etwa `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurz `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI das neu gestartete Gateway verifiziert und den finalen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Neustart-Sentinel der Aktualisierung und gibt ihn zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agenten- und Arbeitsbereichshelfer">
    - `agents.list` gibt konfigurierte Agenteneinträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agentendatensätze und Arbeitsbereichsverdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agenten offengelegt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgabenbuch für SDK- und Operator-Clients bereit.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten Scope `sessionKey`, `runId` oder `taskId` bereit. Run- und Aufgabenabfragen lösen die besitzende Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Herkunft zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agenten oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run beendet ist, und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agentenlaufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungs-Ereignisabonnements für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichten-Ereignisabonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine vorhandene Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway zu einer Sitzung auflösen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides und meldet das aufgelöste kanonische Modell plus effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, Nur-Text-XML-Nutzdaten für Tool-Aufrufe (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken werden entfernt, reine Assistant-Zeilen mit stillen Token wie exakt `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive begrenzte Vollnachrichten-Reader für einen einzelnen sichtbaren Transkripteintrag. Clients übergeben `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl agentenbezogen ist, plus eine Transkript-`messageId`, die zuvor über `chat.history` bereitgestellt wurde, und das Gateway gibt dieselbe anzeige-normalisierte Projektion ohne die leichte Kürzungsgrenze der Historie zurück, wenn der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.send` akzeptiert für einen einzelnen Turn `fastMode: "auto"`, um den Schnellmodus für Modellaufrufe zu verwenden, die vor dem automatischen Grenzwert gestartet wurden, und danach spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe ohne Schnellmodus zu starten. Der Grenzwert ist standardmäßig 60 Sekunden und kann pro Modell mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` konfiguriert werden. Ein `chat.send`-Aufrufer kann für einen einzelnen Turn `fastAutoOnSeconds` übergeben, um den Grenzwert für diese Anfrage zu überschreiben.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.setupCode` erstellt einen mobilen Einrichtungscode und standardmäßig eine PNG-QR-Daten-URL. Es erfordert `operator.admin` und wird absichtlich aus der angekündigten Erkennung ausgelassen. Das Ergebnis enthält `setupCode`, optional `qrDataUrl`, `gatewayUrl`, das nicht geheime `auth`-Label und `urlSource`.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb der Grenzen seiner genehmigten Rolle und des Aufrufer-Scopes.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb der Grenzen seiner genehmigten Rolle und des Aufrufer-Scopes.

    Der Einrichtungscode bettet eine kurzlebige Bootstrap-Anmeldeinformation ein. Clients dürfen sie nicht
    über den Kopplungsablauf hinaus protokollieren oder dauerhaft speichern.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Zustand zurück.
    - `node.rename` aktualisiert ein gekoppeltes Node-Label.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Aufrufanfrage zurück.
    - `node.event` trägt von Nodes ausgehende Ereignisse zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen plus Suche/Wiedergabe ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Wake-Texteinfügung; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein RPC im Enqueue-Stil für manuelle Runs. Clients, die Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` abfragen.
    - `cron.runs` akzeptiert einen optionalen nicht leeren `runId`-Filter, damit Clients einem in die Warteschlange gestellten manuellen Run folgen können, ohne mit anderen Historieneinträgen für denselben Job zu konkurrieren.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere reine Transkript-Chat-
  Ereignisse. In Protokoll v4 tragen Delta-Nutzdaten `deltaText`; `message` bleibt
  der kumulative Assistant-Snapshot. Nicht-Präfix-Ersetzungen setzen `replace=true`
  und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation` und `session.tool`: Transkript-,
  laufende Sitzungsoperation- und Ereignisstrom-Updates für eine abonnierte
  Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des System-Präsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Health-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstroms.
- `cron`: Cron-Run-/Job-Änderungsereignis.
- `shutdown`: Gateway-Herunterfahrbenachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Node-Kopplungslebenszyklus.
- `node.invoke.request`: Broadcast einer Node-Aufrufanfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Trigger-Konfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungs-
  lebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungs-
  lebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Executables
  für Auto-Allow-Prüfungen abzurufen.

### Aufgabenbuch-RPCs

Operator-Clients können Gateway-Hintergrundaufgabendatensätze über
die Aufgabenbuch-RPCs prüfen und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, keinen rohen
Laufzeitzustand.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optional `agentId`, optional `sessionKey`, optional `limit` von `1` bis
    `500` und optionaler String `cursor`.
  - Ergebnis: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` erfordert `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Ergebnis: `{ "task": TaskSummary }`.
  - Fehlende Aufgaben-IDs geben die Gateway-Not-found-Fehlerform zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldet, ob das Aufgabenbuch eine passende Aufgabe enthielt. `cancelled`
    meldet, ob die Laufzeit den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
terminale Zusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agenten,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren Anfragesteller- und Steuerungs-
kontext.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Arbeitsbereich zu lesen.
  - `scope` steuert, welche Oberfläche das primäre `name` adressiert:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben Provider-bewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, wenn einer existiert.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie native Plugin-
    Befehlsverfügbarkeit aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Tool-Katalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit wirksame Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer bereitgestellten Authentifizierungs- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion des aktiven Inventars,
    einschließlich Core-, Plugin-, Channel- und bereits entdeckter MCP-Server-Tools.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen warmen Sitzungs-MCP-Katalog durch die
    finale Tool-Richtlinie projizieren, erstellt aber keine MCP-Laufzeiten, verbindet keine Transports und gibt
    kein `tools/list` aus. Wenn kein passender warmer Katalog existiert, kann die Antwort einen Hinweis wie
    `mcp-not-yet-connected`, `mcp-not-yet-listed` oder `mcp-stale-catalog` enthalten.
  - Wirksame Tool-Einträge verwenden `source="core"`, `source="plugin"`, `source="channel"` oder
    `source="mcp"`.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungsagent
    mit `agentId` übereinstimmen.
  - Nur Eigentümern vorbehaltene Core-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    Eigentümer-/Admin-Identität (`operator.admin`), obwohl die Methode `tools.invoke`
    selbst `operator.write` ist.
  - Die Antwort ist ein SDK-seitiger Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Tool-Richtlinienpipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Arbeitsbereich zu lesen.
  - Die Antwort enthält Berechtigung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Entdeckungsmetadaten aufrufen.
- Operatoren können `skills.upload.begin`, `skills.upload.chunk` und
  `skills.upload.commit` (`operator.admin`) aufrufen, um ein privates Skill-Archiv
  vor der Installation bereitzustellen. Dies ist ein separater Admin-Uploadpfad für vertrauenswürdige Clients,
  nicht der normale ClawHub-Skill-Installationsfluss, und standardmäßig deaktiviert, sofern
  `skills.install.allowUploadedArchives` nicht aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakt dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` verifiziert die endgültige Größe und
    SHA-256. Commit finalisiert nur den Upload; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind Zip-Archive, die ein `SKILL.md`-Root enthalten. Der
    interne Verzeichnisname des Archivs wählt niemals das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Arbeitsbereichs.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen committeten Upload in das Verzeichnis `skills/<slug>`
    des Standard-Agent-Arbeitsbereichs. Der Slug und der Force-Wert müssen mit der ursprünglichen
    `skills.upload.begin`-Anfrage übereinstimmen. Dieser Modus wird abgelehnt, sofern
    `skills.install.allowUploadedArchives` nicht aktiviert ist. Die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installationsmodus: `{ name, installId, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
    Ältere Clients können weiterhin `dangerouslyForceUnsafeInstall` senden; dieses Feld ist
    veraltet, wird nur aus Protokollkompatibilität akzeptiert und ignoriert. Verwenden Sie
    `security.installPolicy` für operatorgesteuerte Installationsentscheidungen.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Arbeitsbereich.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen Parameter `view`:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch entdeckter Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Verhalten in Picker-Größe. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich providerbezogener Entdeckung für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen existieren.
- `"all"`: vollständiger Gateway-Katalog, unter Umgehung von `agents.defaults.models`. Verwenden Sie dies für Diagnose- und Entdeckungs-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, broadcastet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als autoritativen Befehls-/cwd-/Sitzungskontext wieder.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der final genehmigten `system.run`-Weiterleitung mutiert, lehnt das
  Gateway den Lauf ab, statt der mutierten Nutzlast zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt Fallback auf reine Sitzungsausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).
- Finale `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn Zustellung
  angefordert wurde, mit denselben Statuswerten `sent`, `suppressed`, `partial_failed` und `failed`,
  die für [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status) dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `packages/gateway-protocol/src/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Bereiche ab, die
  sein aktuelles Protokoll nicht enthalten. Aktuelle Clients und Server erfordern
  Protokoll v4.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Werte sind
über Protokoll v4 hinweg stabil und bilden die erwartete Baseline für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Konfig./Env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Begrenzung nach Device-Token-Schließen | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Force-Stop-Nachfrist vor `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Schließen bei Tick-Timeout                | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server kündigt das effektive `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake beachten.

## Auth

- Die Shared-Secret-Gateway-Authentifizierung verwendet je nach konfiguriertem Authentifizierungsmodus `connect.params.auth.token` oder
  `connect.params.auth.password`.
- Modi mit Identitätsinformationen wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Authentifizierungsprüfung beim Verbindungsaufbau anhand von
  Request-Headern statt `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Shared-Secret-Authentifizierung beim Verbindungsaufbau
  vollständig; setzen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt der Gateway ein **Geräte-Token** aus, das auf die Verbindungsrolle
  + Scopes beschränkt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte vom
  Client für zukünftige Verbindungen dauerhaft gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung dauerhaft speichern.
- Eine erneute Verbindung mit diesem **gespeicherten** Geräte-Token sollte auch den gespeicherten
  genehmigten Scope-Satz für dieses Token wiederverwenden. Dadurch bleiben bereits gewährte
  Lese-/Probe-/Statuszugriffe erhalten, und erneute Verbindungen werden nicht stillschweigend auf einen
  engeren impliziten Nur-Admin-Scope reduziert.
- Clientseitige Zusammensetzung der Verbindungs-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (geschlüsselt nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der oben genannten ein
    `auth.token` aufgelöst hat. Ein Shared Token oder ein beliebiges aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **vertrauenswürdige Endpunkte** beschränkt —
    loopback oder `wss://` mit angepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Der integrierte Setup-Code-Bootstrap gibt das primäre Node-
  `hello-ok.auth.deviceToken` sowie ein begrenztes Operator-Token in
  `hello-ok.auth.deviceTokens` für die vertrauenswürdige mobile Übergabe zurück. Das Operator-Token
  enthält `operator.talk.secrets` für native Talk-Konfigurationslesevorgänge, schließt aber
  Pairing-Mutations-Scopes und `operator.admin` aus.
- Während ein nicht-baseline Setup-Code-Bootstrap auf Genehmigung wartet, enthalten `PAIRING_REQUIRED`-
  Details `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  und `pauseReconnect: false`. Clients sollten weiterhin mit demselben
  Bootstrap-Token neu verbinden, bis die Anfrage genehmigt wurde oder das Token ungültig wird.
- Speichern Sie `hello-ok.auth.deviceTokens` nur dauerhaft, wenn die Verbindung Bootstrap-Authentifizierung
  über einen vertrauenswürdigen Transport wie `wss://` oder loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` bereitstellt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; gecachte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte Token pro Gerät wiederverwendet.
- Geräte-Token können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`). Das Rotieren oder
  Widerrufen eines Node- oder anderen Nicht-Operator-Rollen-Tokens erfordert zusätzlich `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das Ersatz-
  Bearer-Token nur bei Aufrufen desselben Geräts zurück, die bereits mit
  diesem Geräte-Token authentifiziert sind, sodass reine Token-Clients ihren Ersatz vor
  dem erneuten Verbinden dauerhaft speichern können. Shared-/Admin-Rotationen geben das Bearer-Token nicht zurück.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf den genehmigten Rollensatz beschränkt,
  der im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann keine
  Geräterolle erweitern oder anvisieren, die die Pairing-Genehmigung nie gewährt hat.
- Bei gekoppelten Geräte-Token-Sitzungen ist die Geräteverwaltung selbstbezogen, es sei denn, der
  Aufrufer hat zusätzlich `operator.admin`: Nicht-Admin-Aufrufer können nur das
  Operator-Token für ihren **eigenen** Geräteeintrag verwalten. Node- und andere Nicht-Operator-
  Token-Verwaltung ist nur Admins vorbehalten, auch für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den Scope-Satz des Ziel-Operator-
  Tokens gegen die aktuellen Sitzungs-Scopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem gecachten Token pro Gerät versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Wiederverbindungs-Schleifen stoppen und Hinweise für Operator-Aktionen anzeigen.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber die
  angeforderten Rollen/Scopes nicht abdeckt. Clients sollten dies nicht als fehlerhaftes Token darstellen;
  fordern Sie den Operator auf, erneut zu pairen oder den engeren/breiteren Scope-Vertrag zu genehmigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Die automatische Pairing-Genehmigung konzentriert sich auf direkte lokale loopback-Verbindungen.
- OpenClaw hat außerdem einen schmalen backend-/container-lokalen Selbstverbindungspfad für
  vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Same-Host-tailnet- oder LAN-Verbindungen werden für Pairing weiterhin als remote behandelt und
  erfordern eine Genehmigung.
- WS-Clients enthalten normalerweise während `connect` eine `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, erhebliche Sicherheitsherabstufung).
  - direkte-loopback `gateway-client` Backend-RPCs auf dem reservierten internen
    Hilfspfad.
- Das Weglassen der Geräteidentität hat Auswirkungen auf Scopes. Wenn eine gerätelose Operator-
  Verbindung über einen expliziten Vertrauenspfad zugelassen wird, löscht OpenClaw dennoch
  selbst deklarierte Scopes auf eine leere Menge, sofern dieser Pfad keine benannte
  Ausnahme zur Scope-Beibehaltung hat. Scope-gesteuerte Methoden schlagen dann mit
  `missing scope` fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Control-UI-
  Break-Glass-Pfad zur Scope-Beibehaltung. Er gewährt keinen beliebigen
  benutzerdefinierten Backend- oder CLI-förmigen WebSocket-Clients Scopes.
- Der reservierte direkte-loopback `gateway-client` Backend-Hilfspfad behält
  Scopes nur für interne lokale Control-Plane-RPCs bei; benutzerdefinierte Backend-IDs erhalten
  diese Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose der Geräteauthentifizierungs-Migration

Für Legacy-Clients, die noch das Signaturverhalten vor Challenge verwenden, gibt `connect` nun
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload passt nicht zum v2-Payload.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.    |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scope-/Token-/Nonce-Feldern
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber Metadaten-Pinning
  für gekoppelte Geräte steuert weiterhin die Befehlsrichtlinie bei erneuter Verbindung.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikats-Fingerprint anpinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `packages/gateway-protocol/src/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
