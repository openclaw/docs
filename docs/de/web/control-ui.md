---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
summary: Browserbasierte Control UI für das Gateway (Chat, Nodes, Konfiguration)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:01:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Die Control UI ist eine kleine **Vite + Lit** Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` setzen (z. B. `/openclaw`)

Sie spricht **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen werden kann, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitäts-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitäts-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfenster des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Beim Onboarding
wird normalerweise beim ersten Verbinden ein Gateway-Token für die Authentifizierung mit gemeinsamem Geheimnis erzeugt,
aber Passwort-Authentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätepaarung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway
eine **einmalige Genehmigung zur Paarung** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Dies ist eine Sicherheitsmaßnahme, um
unbefugten Zugriff zu verhindern.

**Was Sie sehen werden:** "disconnected (1008): pairing required"

**So genehmigen Sie das Gerät:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Request-ID genehmigen
openclaw devices approve <requestId>
```

Wenn der Browser die Paarung mit geänderten Authentifizierungsdetails wiederholt (Rolle/Scopes/öffentlicher
Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf
Schreib-/Admin-Zugriff umstellen, wird dies als Genehmigungs-Upgrade behandelt, nicht als stilles
Neuverbinden. OpenClaw hält die alte Genehmigung aktiv, blockiert das breiter gefasste Reconnect
und fordert Sie auf, den neuen Satz an Scopes explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung mehr,
es sei denn, Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale `local loopback`-Browserverbindungen (`127.0.0.1` / `localhost`) werden
  automatisch genehmigt.
- Browserverbindungen über Tailnet und LAN erfordern weiterhin eine explizite Genehmigung, selbst wenn
  sie vom selben Rechner stammen.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordern Browserwechsel oder
  das Löschen von Browserdaten eine erneute Paarung.

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und
Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen beigefügt wird. Sie
liegt im Browser-Speicher, ist auf das aktuelle Browserprofil beschränkt und wird weder
mit anderen Geräten synchronisiert noch serverseitig dauerhaft gespeichert — abgesehen von den normalen
Urheberschaftsmetadaten im Transkript für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder
der Wechsel des Browsers setzt sie auf leer zurück.

## Laufzeit-Konfigurationsendpunkt

Die Control UI lädt ihre Laufzeiteinstellungen von
`/__openclaw/control-ui-config.json`. Dieser Endpunkt wird durch dieselbe
Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: nicht authentifizierte Browser können
ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-
Token/Passwort, eine Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand des Gebietsschemas Ihres Browsers lokalisieren.
Um dies später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Die
Auswahl für das Gebietsschema befindet sich in der Karte Gateway Access, nicht unter Appearance.

- Unterstützte Gebietsschemata: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Nicht-englische Übersetzungen werden im Browser lazy geladen.
- Das ausgewählte Gebietsschema wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway-WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Direkt aus dem Browser per WebRTC mit OpenAI Realtime sprechen. Das Gateway
  prägt mit `talk.realtime.session` ein kurzlebiges Realtime-Client-Secret; der
  Browser sendet Mikrofon-Audio direkt an OpenAI und leitet
  Tool-Aufrufe `openclaw_agent_consult` über `chat.send` an das größere
  konfigurierte OpenClaw-Modell zurück.
- Tool-Aufrufe + Live-Karten zur Tool-Ausgabe im Chat streamen (Agent-Ereignisse)
- Channels: integrierte sowie gebündelte/externe Plugin-Channel-Status, QR-Login und Channel-spezifische Konfiguration (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Präsenzliste + Aktualisierung (`system-presence`)
- Sitzungen: Liste + modell-/thinking-/fast-/verbose-/trace-/reasoning-Overrides pro Sitzung (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`)
- Skills: Status, aktivieren/deaktivieren, installieren, API-Key-Updates (`skills.*`)
- Nodes: Liste + Fähigkeiten (`node.list`)
- Exec-Genehmigungen: Allowlists für Gateway oder Node bearbeiten + Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: anwenden + mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken
- Schreibvorgänge auf der Konfiguration enthalten einen Base-Hash-Schutz, um gleichzeitige Bearbeitungen nicht zu überschreiben
- Schreibvorgänge auf der Konfiguration (`config.set`/`config.apply`/`config.patch`) führen außerdem im Vorfeld die Auflösung aktiver SecretRefs für Refs im eingereichten Konfigurations-Payload durch; nicht aufgelöste aktive eingereichte Refs werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich `title` / `description` pro Feld, passender UI-Hinweise, unmittelbarer
  Zusammenfassungen untergeordneter Elemente, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten
  sowie Plugin- + Channel-Schemata, wenn verfügbar); ein roher JSON-Editor ist
  nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat
- Wenn ein Snapshot keinen sicheren Raw-Roundtrip zulässt, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot
- „Auf Gespeichertes zurücksetzen“ im Raw-JSON-Editor erhält die roh verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen geflatteten Snapshot neu zu rendern, sodass externe Änderungen ein Zurücksetzen überstehen, wenn der Snapshot sicher round-trip-fähig ist
- Strukturierte SecretRef-Objektwerte werden in Formular-Textfeldern schreibgeschützt dargestellt, um versehentliche Beschädigung durch Umwandlung von Objekt zu String zu verhindern
- Debug: Snapshots von Status/Health/Modellen + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`)
- Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: ein Paket-/Git-Update + Neustart ausführen (`update.run`) mit einem Neustartbericht

Hinweise zum Cron-Jobs-Panel:

- Bei isolierten Jobs ist die Zustellung standardmäßig auf eine Announce-Zusammenfassung gesetzt. Sie können zu none wechseln, wenn Sie nur interne Ausführungen möchten.
- Felder für Channel/Ziel erscheinen, wenn announce ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
- Für Jobs der Hauptsitzung sind die Zustellmodi webhook und none verfügbar.
- Erweiterte Bearbeitungssteuerungen umfassen delete-after-run, clear agent override, exakte/gestaffelte Cron-Optionen,
  Overrides für Agent-Modell/Thinking und Best-Effort-Zustellungsumschalter.
- Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Schaltfläche zum Speichern, bis sie korrigiert sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: gespeicherte ältere Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert werden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
- Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
- Antworten von `chat.history` sind aus Sicherheitsgründen für die UI größenbegrenzt. Wenn Einträge im Transkript zu groß sind, kann das Gateway lange Textfelder kürzen, schwere Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- Vom Assistenten erzeugte Bilder werden als verwaltete Medienreferenzen gespeichert und über authentifizierte Gateway-Medien-URLs wieder bereitgestellt, sodass Reloads nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Antwort von `chat.history` erhalten bleiben.
- `chat.history` entfernt außerdem nur für die Anzeige bestimmte Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzten Tool-Call-Blöcken) sowie durchgesickerte ASCII-/Vollbreiten-Kontrolltoken des Modells und lässt Assistenteneinträge weg, deren gesamter sichtbarer Text nur aus dem exakten stillen Token `NO_REPLY` / `no_reply` besteht.
- `chat.inject` hängt dem Sitzungs-Transkript eine Assistentennotiz an und sendet ein `chat`-Ereignis für UI-only-Aktualisierungen (keine Agent-Ausführung, keine Channel-Zustellung).
- Die Auswahlfelder für Modell und Thinking im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; es sind persistente Sitzungs-Overrides, keine Optionen nur für einen Turn.
- Der Talk-Modus verwendet einen registrierten Realtime-Voice-Provider, der browserbasierte
  WebRTC-Sitzungen unterstützt. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus
  `talk.providers.openai.apiKey`, oder verwenden Sie die Konfiguration des Realtime-Providers von Voice Call wieder.
  Der Browser erhält niemals den normalen OpenAI-API-Key; er erhält
  nur das ephemere Realtime-Client-Secret. Google Live Realtime Voice wird
  für backendseitige Voice-Call- und Google-Meet-Bridges unterstützt, aber noch nicht für diesen browserbasierten
  WebRTC-Pfad. Der Prompt der Realtime-Sitzung wird vom Gateway zusammengestellt;
  `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Instruction-Overrides.
- Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der
  Diktier-Mikrofon-Schaltfläche. Wenn Talk startet, zeigt die Statuszeile des Composers
  `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder
  `Asking OpenClaw...`, während ein Realtime-Tool-Aufruf das konfigurierte
  größere Modell über `chat.send` konsultiert.
- Stoppen:
  - Klicken Sie auf **Stop** (ruft `chat.abort` auf)
  - Während eine Ausführung aktiv ist, werden normale Follow-ups in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steer**, um dieses Follow-up in den laufenden Turn einzuspeisen.
  - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des regulären Pfads abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Ausführungen für diese Sitzung abzubrechen
- Beibehaltung von Teilinhalten beim Abbruch:
  - Wenn eine Ausführung abgebrochen wird, kann partieller Assistententext weiterhin in der UI angezeigt werden
  - Das Gateway speichert partiellen Assistententext aus abgebrochenen Ausführungen im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist
  - Gespeicherte Einträge enthalten Abbruchmetadaten, damit Consumer des Transkripts Teilausgaben nach Abbruch von normal abgeschlossener Ausgabe unterscheiden können

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]`
rendern. Die Iframe-Sandbox-Richtlinie wird gesteuert durch
`gateway.controlUi.embedSandbox`:

- `strict`: deaktiviert die Ausführung von Skripten innerhalb gehosteter Einbettungen
- `scripts`: erlaubt interaktive Einbettungen bei beibehaltener Origin-Isolation; dies ist
  der Standard und reicht normalerweise für in sich geschlossene Browser-Spiele/Widgets aus
- `trusted`: fügt `allow-same-origin` zusätzlich zu `allow-scripts` für gleichseitige
  Dokumente hinzu, die absichtlich stärkere Berechtigungen benötigen

Beispiel:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-
Verhalten benötigt. Für die meisten vom Agent erzeugten Spiele und interaktiven Canvases ist `scripts`
die sicherere Wahl.

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie
absichtlich möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Behalten Sie das Gateway auf Loopback und lassen Sie Tailscale Serve es mit HTTPS proxyen:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

Standardmäßig können sich Anfragen an Control UI/WebSocket über Tailscale-Identitäts-Header
(`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw
verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit
`tailscale whois` auflöst und sie mit dem Header abgleicht, und akzeptiert diese nur, wenn die
Anfrage Loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Datenverkehr explizite Anmeldedaten mit gemeinsamem Geheimnis
erzwingen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP
und denselben Authentifizierungsbereich vor dem Schreiben des Rate-Limits serialisiert. Gleichzeitige fehlerhafte Wiederholungsversuche
aus demselben Browser können daher beim zweiten Request `retry later` anzeigen
statt zwei einfache Nichtübereinstimmungen parallel durchrennen zu lassen.
Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf diesem Host
nicht vertrauenswürdiger lokaler Code laufen kann, verlangen Sie Token-/Passwort-Authentifizierung.

### An Tailnet binden + Token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Dann öffnen Sie:

- `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

Fügen Sie das passende gemeinsame Geheimnis in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über unverschlüsseltes HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Verbindungen der Control UI ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche operatorseitige Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** HTTPS verwenden (Tailscale Serve) oder die UI lokal öffnen:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Umschalters für unsichere Authentifizierung:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` ist nur ein lokaler Kompatibilitäts-Umschalter:

- Er erlaubt localhost-Control-UI-Sitzungen, in
  nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
- Er umgeht keine Paarungsprüfungen.
- Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht localhost) Verbindungen.

**Nur für Break-Glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität in der Control UI und ist ein
schwerwiegendes Sicherheits-Downgrade. Machen Sie dies nach einer Notfallverwendung schnell rückgängig.

Hinweis zu trusted-proxy:

- erfolgreiche trusted-proxy-Authentifizierung kann **operator**-Sitzungen der Control UI ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Sitzungen der Control UI mit Node-Rolle
- Reverse-Proxys auf demselben Host über Loopback erfüllen weiterhin keine trusted-proxy-Authentifizierung; siehe
  [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Nur Assets mit **gleichem Ursprung** und `data:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden ausgeliefert werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Entfernte Avatar-URLs, die durch Channel-Metadaten ausgegeben werden, werden in den Avatar-Helpern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe vom Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten Route für Assistant-Medien). Das verhindert, dass die Avatar-Route die Agent-Identität auf Hosts offenlegt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (nicht empfohlen auf gemeinsam genutzten Hosts), wird auch die Avatar-Route unauthentifiziert, entsprechend dem Rest des Gateway.

## Erstellen der UI

Das Gateway liefert statische Dateien aus `dist/control-ui` aus. Erstellen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Base (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Entwicklungsserver):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal möchten,
das Gateway aber anderswo läuft.

1. Starten Sie den UI-Dev-Server: `pnpm ui:dev`
2. Öffnen Sie eine URL wie:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optionale einmalige Authentifizierung (falls nötig):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Hinweise:

- `gatewayUrl` wird nach dem Laden in `localStorage` gespeichert und aus der URL entfernt.
- `token` sollte wann immer möglich über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Leaks in Request-Logs und Referer vermieden werden. Ältere Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmalig importiert, aber nur als Fallback, und sofort nach dem Bootstrap entfernt.
- `password` wird nur im Speicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfiguration oder Umgebungs-Credentials zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Top-Level-Fenster (nicht eingebettet) akzeptiert, um Clickjacking zu verhindern.
- Bereitstellungen der Control UI ohne Loopback müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Das gilt auch für entfernte Dev-Setups.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Das bedeutet, jeden Browser-Origin zu erlauben, nicht „den gerade verwendeten Host abzugleichen“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert
  den Modus für Host-Header-Origin-Fallback, ist aber ein gefährlicher Sicherheitsmodus.

Beispiel:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Details zur Einrichtung des Fernzugriffs: [Remote access](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
- [TUI](/de/web/tui) — terminalbasierte Benutzeroberfläche
- [Health Checks](/de/gateway/health) — Gateway-Health-Monitoring
