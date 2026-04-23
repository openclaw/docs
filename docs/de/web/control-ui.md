---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
summary: Browserbasierte Control UI für das Gateway (Chat, Nodes, Konfiguration)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T06:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e3dbba6b05a5e00499fbe75e6a66a89e0b6b3d9d66e69143068e087f517b8a
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (Browser)

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

Das Einstellungsfeld des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht gespeichert. Das Onboarding
erzeugt normalerweise beim ersten Verbinden ein Gateway-Token für Shared-Secret-Auth, aber Passwort-
Auth funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Geräte-Pairing (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway
eine **einmalige Pairing-Genehmigung** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Dies ist eine Sicherheitsmaßnahme, um
unbefugten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): pairing required“

**So genehmigen Sie das Gerät:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Request-ID genehmigen
openclaw devices approve <requestId>
```

Wenn der Browser Pairing mit geänderten Auth-Details (Rolle/Scopes/Public
Key) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gepaart ist und Sie ihn von Lesezugriff auf
Schreib-/Admin-Zugriff ändern, wird dies als Upgrade der Genehmigung behandelt, nicht als stilles
Reconnect. OpenClaw hält die alte Genehmigung aktiv, blockiert das breitere Reconnect
und fordert Sie auf, den neuen Scope-Satz explizit zu genehmigen.

Sobald genehmigt, wird das Gerät gespeichert und erfordert keine erneute Genehmigung, außer
Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale Browserverbindungen über local loopback (`127.0.0.1` / `localhost`) werden
  automatisch genehmigt.
- Browserverbindungen über Tailnet und LAN erfordern weiterhin eine explizite Genehmigung, selbst wenn
  sie von derselben Maschine stammen.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordern Browserwechsel oder
  das Löschen von Browserdaten ein erneutes Pairing.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden basierend auf Ihrer Browser-Sprache lokalisieren.
Um dies später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Der
Sprachauswähler befindet sich in der Karte „Gateway Access“, nicht unter „Appearance“.

- Unterstützte Sprachen: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`
- Nicht englische Übersetzungen werden im Browser lazy geladen.
- Die ausgewählte Sprache wird im Browser-Speicher abgelegt und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway-WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Tool-Aufrufe + Live-Karten mit Tool-Ausgabe im Chat streamen (Agent-Ereignisse)
- Kanäle: integrierte plus gebündelte/externe Plugin-Kanalstatus, QR-Login und Konfiguration pro Kanal (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Presence-Liste + Aktualisierung (`system-presence`)
- Sitzungen: Liste + Überschreibungen pro Sitzung für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Laufhistorie (`cron.*`)
- Skills: Status, aktivieren/deaktivieren, installieren, API-Key-Updates (`skills.*`)
- Nodes: Liste + Fähigkeiten (`node.list`)
- `exec`-Genehmigungen: Allowlists für Gateway oder Node bearbeiten + Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: mit Validierung anwenden + neu starten (`config.apply`) und die zuletzt aktive Sitzung wecken
- Konfigurationsschreibvorgänge enthalten einen Base-Hash-Guard, um das Überschreiben paralleler Änderungen zu verhindern
- Konfigurationsschreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen außerdem vorab die Auflösung aktiver SecretRefs für Referenzen in der übermittelten Konfigurations-Payload; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich Feld-`title` / `description`, passender UI-Hints, Zusammenfassungen unmittelbarer untergeordneter Elemente,
  Doku-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten
  sowie Plugin- + Kanalschemata, wenn verfügbar); der Raw-JSON-Editor ist
  nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat
- Wenn ein Snapshot keinen sicheren Raw-Roundtrip kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot
- Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt dargestellt, um versehentliche Objekt-zu-String-Korruption zu verhindern
- Debug: Snapshots von Status/Health/Modellen + Ereignislog + manuelle RPC-Aufrufe (`status`, `health`, `models.list`)
- Logs: Live-Tail von Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit Neustartbericht

Hinweise zum Cron-Jobs-Panel:

- Bei isolierten Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf none wechseln, wenn Sie rein interne Läufe möchten.
- Kanal-/Zielfelder erscheinen, wenn announce ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to` auf einer gültigen HTTP(S)-Webhook-URL.
- Für Jobs der Hauptsitzung sind die Zustellmodi Webhook und none verfügbar.
- Erweiterte Bearbeitungssteuerungen umfassen delete-after-run, clear agent override, genaue/staffelbare Cron-Optionen,
  Überschreibungen für Agent-Modell/Thinking und Best-Effort-Zustellungsumschalter.
- Formularvalidierung erfolgt inline mit Fehlern pro Feld; ungültige Werte deaktivieren die Schaltfläche zum Speichern, bis sie korrigiert sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn weggelassen, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert werden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
- Ein erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
- Antworten von `chat.history` sind aus Sicherheitsgründen für die UI größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, schwere Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- `chat.history` entfernt außerdem reine Anzeige-Inline-Directive-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie geleakte ASCII-/Full-Width-Modell-Steuertokens und lässt Assistant-Einträge aus, deren kompletter sichtbarer Text nur aus dem exakten stillen Token `NO_REPLY` / `no_reply` besteht.
- `chat.inject` hängt eine Assistant-Notiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Updates (kein Agent-Lauf, keine Kanalzustellung).
- Die Auswähler für Modell und Thinking im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungs-Overrides, keine Sendeoptionen nur für einen Durchlauf.
- Stop:
  - Auf **Stop** klicken (ruft `chat.abort` auf)
  - `/stop` eingeben (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um Out-of-Band abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe dieser Sitzung abzubrechen
- Beibehaltung von Teilinhalten bei Abbruch:
  - Wenn ein Lauf abgebrochen wird, kann partieller Assistant-Text weiterhin in der UI angezeigt werden
  - Das Gateway speichert abgebrochenen partiellen Assistant-Text in der Transkript-Historie, wenn gepufferte Ausgabe vorhanden ist
  - Gespeicherte Einträge enthalten Abbruch-Metadaten, damit Verbraucher von Transkripten Teilinhalte nach Abbruch von normal abgeschlossener Ausgabe unterscheiden können

## Gehostete Embeds

Assistant-Nachrichten können gehostete Web-Inhalte inline mit dem Shortcode `[embed ...]`
rendern. Die Iframe-Sandbox-Richtlinie wird gesteuert durch
`gateway.controlUi.embedSandbox`:

- `strict`: deaktiviert die Skriptausführung innerhalb gehosteter Embeds
- `scripts`: erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist
  die Standardeinstellung und reicht normalerweise für in sich geschlossene Browser-Spiele/Widgets
- `trusted`: fügt zusätzlich zu `allow-scripts` auch `allow-same-origin` hinzu für Same-Site-
  Dokumente, die absichtlich stärkere Berechtigungen benötigen

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
Verhalten benötigt. Für die meisten agentgenerierten Spiele und interaktiven Canvases ist `scripts`
die sicherere Wahl.

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie
absichtlich möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Lassen Sie das Gateway auf local loopback und lassen Sie Tailscale Serve es per HTTPS proxien:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Standardmäßig können sich Anfragen der Control UI/WebSocket-Serve über Tailscale-Identitäts-Header
(`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw
verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit
`tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die
Anfrage local loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie explizite Shared-Secret-
Anmeldedaten auch für Serve-Traffic verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Auth-Versuche für dieselbe Client-IP
und denselben Auth-Bereich vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen
aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen,
statt dass zwei einfache Nichtübereinstimmungen parallel gegeneinander laufen.
Tokenlose Serve-Auth setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code laufen kann, verlangen Sie Token-/Passwort-Auth.

### Auf tailnet binden + Token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Dann öffnen Sie:

- `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Verbindungen der Control UI ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur-localhost-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Auth über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** HTTPS verwenden (Tailscale Serve) oder die UI lokal öffnen:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Umschalters für unsichere Auth:**

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

- Es erlaubt localhost-Control-UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
- Es umgeht keine Pairing-Prüfungen.
- Es lockert keine Anforderungen an Geräteidentität für entfernte Verbindungen (nicht localhost).

**Nur für den Notfall:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` deaktiviert die Prüfung der Geräteidentität für die Control UI und ist eine
schwerwiegende Sicherheitsverschlechterung. Setzen Sie dies nach der Notfallverwendung schnell wieder zurück.

Hinweis zu trusted-proxy:

- erfolgreiche `trusted-proxy`-Authentifizierung kann **operator**-Control-UI-Sitzungen ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle
- Reverse-Proxys auf local loopback desselben Hosts erfüllen `trusted-proxy`-Auth weiterhin nicht; siehe
  [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Nur Assets mit **gleicher Origin** und `data:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Entfernte Avatar-URLs, die durch Kanalmetadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe von einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Avatar-Routen-Auth

Wenn Gateway-Auth konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route die Agent-Identität auf Hosts offenlegt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, damit das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Auth deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, im Einklang mit dem Rest des Gateway.

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionaler absoluter Base-Pfad (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + Remote-Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
sich von der HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server
lokal betreiben möchten, das Gateway aber anderswo läuft.

1. Starten Sie den UI-Dev-Server: `pnpm ui:dev`
2. Öffnen Sie eine URL wie:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optionale einmalige Authentifizierung (falls erforderlich):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Hinweise:

- `gatewayUrl` wird nach dem Laden in localStorage gespeichert und aus der URL entfernt.
- `token` sollte wann immer möglich über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, was Lecks in Request-Logs und Referer vermeidet. Veraltete Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und direkt nach dem Bootstrap entfernt.
- `password` wird nur im Arbeitsspeicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn das Gateway hinter TLS steht (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
- Nicht-loopback-Control-UI-Deployments müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Das gilt auch für Remote-Dev-Setups.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Es bedeutet, jede Browser-Origin zuzulassen, nicht „den gerade verwendeten Host abgleichen“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den
  Fallback-Modus für Host-Header-Origin, ist aber ein gefährlicher Sicherheitsmodus.

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

Details zur Einrichtung des Remote-Zugriffs: [Remote access](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [Health Checks](/de/gateway/health) — Gateway-Integritätsüberwachung
