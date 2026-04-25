---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-04-25T13:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Die Steuerungsoberfläche ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: Setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird beim WebSocket-Handshake bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identity-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identity-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfeld des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht persistent gespeichert. Das Onboarding
erzeugt bei der ersten Verbindung für Shared-Secret-Authentifizierung in der Regel
ein Gateway-Token, aber Passwort-Authentifizierung funktioniert ebenfalls, wenn
`gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich mit der Steuerungsoberfläche von einem neuen Browser oder Gerät aus verbinden, verlangt das Gateway
eine **einmalige Kopplungsfreigabe** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Dies ist eine Sicherheitsmaßnahme, um
unbefugten Zugriff zu verhindern.

**Was Sie sehen werden:** "disconnected (1008): pairing required"

**So genehmigen Sie das Gerät:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Anfrage-ID genehmigen
openclaw devices approve <requestId>
```

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/Public
Key) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf
Schreib-/Admin-Zugriff umstellen, wird dies als Upgrade einer Genehmigung behandelt, nicht als stiller
Reconnect. OpenClaw lässt die alte Genehmigung aktiv, blockiert die umfassendere Wiederverbindung
und fordert Sie auf, den neuen Scope-Satz explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und muss nicht erneut genehmigt werden, außer
Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale loopback-Browser-Verbindungen (`127.0.0.1` / `localhost`) werden
  automatisch genehmigt.
- Browser-Verbindungen über Tailnet und LAN erfordern weiterhin eine explizite Genehmigung, selbst wenn
  sie vom selben Rechner stammen.
- Jedes Browser-Profil erzeugt eine eindeutige Geräte-ID, daher erfordern Browserwechsel oder das
  Löschen von Browserdaten eine erneute Kopplung.

## Persönliche Identität (browserlokal)

Die Steuerungsoberfläche unterstützt eine persönliche Identität pro Browser (Anzeigename und
Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen hinzugefügt wird. Sie
liegt im Browser-Speicher, ist auf das aktuelle Browser-Profil beschränkt und wird nicht
mit anderen Geräten synchronisiert oder serverseitig persistent gespeichert, abgesehen von den normalen
Transkript-Metadaten zur Urheberschaft bei tatsächlich gesendeten Nachrichten. Das Löschen der Website-Daten oder
der Wechsel des Browsers setzt sie auf leer zurück.

## Laufzeitkonfigurations-Endpunkt

Die Steuerungsoberfläche ruft ihre Laufzeiteinstellungen von
`/__openclaw/control-ui-config.json` ab. Dieser Endpunkt ist durch dieselbe
Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können
ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-
Token/Passwort, Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Steuerungsoberfläche kann sich beim ersten Laden anhand Ihres Browser-Gebietsschemas lokalisieren.
Um dies später zu überschreiben, öffnen Sie **Überblick -> Gateway-Zugriff -> Sprache**. Die
Sprachauswahl befindet sich in der Karte Gateway-Zugriff, nicht unter Darstellung.

- Unterstützte Gebietsschemata: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Nicht-englische Übersetzungen werden verzögert im Browser geladen.
- Das ausgewählte Gebietsschema wird im Browser-Speicher gespeichert und bei späteren Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Direkt aus dem Browser über WebRTC mit OpenAI Realtime sprechen. Das Gateway
  stellt mit `talk.realtime.session` ein kurzlebiges Realtime-Client-Secret aus; der
  Browser sendet Mikrofon-Audio direkt an OpenAI und leitet
  `openclaw_agent_consult`-Tool-Aufrufe über `chat.send` an das größer konfigurierte
  OpenClaw-Modell zurück.
- Tool-Aufrufe und Live-Tool-Ausgabekarten im Chat streamen (Agent-Ereignisse)
- Channels: integrierte sowie gebündelte/externe Plugin-Channels mit Status, QR-Login und Konfiguration pro Channel (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Präsenzliste + Aktualisierung (`system-presence`)
- Sitzungen: Liste + sitzungsspezifische Überschreibungen für Modell/Thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming-Status, Aktivieren/Deaktivieren-Schalter und Dream Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`)
- Skills: Status, aktivieren/deaktivieren, installieren, API-Key-Aktualisierungen (`skills.*`)
- Nodes: Liste + Caps (`node.list`)
- Exec-Genehmigungen: Gateway- oder Node-Allowlists bearbeiten + Ask-Policy für `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: anwenden + mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken
- Konfigurationsschreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben paralleler Bearbeitungen zu verhindern
- Konfigurationsschreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen außerdem vorab die aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurations-Payload; nicht auflösbare aktive übermittelte Refs werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich Feld-`title` / `description`, passender UI-Hinweise, Zusammenfassungen direkter untergeordneter Elemente, Dokumentations-Metadaten für verschachtelte Objekt-/Wildcard-/Array-/Kompositions-Knoten
  sowie Plugin- + Channel-Schemata, wenn verfügbar); ein Raw-JSON-Editor ist
  nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip unterstützt
- Wenn ein Snapshot keinen sicheren Raw-Roundtrip unterstützt, erzwingt die Steuerungsoberfläche den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot
- „Reset to saved“ im Raw-JSON-Editor bewahrt die in Raw verfasste Form (Formatierung, Kommentare, `$include`-Layout), anstatt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen einen Reset überstehen, wenn der Snapshot sicher einen Raw-Roundtrip unterstützt
- Strukturierte SecretRef-Objektwerte werden in Formular-Textfeldern schreibgeschützt dargestellt, um eine versehentliche Beschädigung durch Objekt-zu-String-Konvertierung zu verhindern
- Debugging: Status-/Health-/Models-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`)
- Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit Neustartbericht

Hinweise zum Cron-Jobs-Feld:

- Für isolierte Jobs ist die Auslieferung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf none umstellen, wenn Sie nur interne Ausführungen möchten.
- Channel-/Zielfelder erscheinen, wenn announce ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
- Für Main-Session-Jobs sind die Auslieferungsmodi webhook und none verfügbar.
- Erweiterte Bearbeitungsoptionen umfassen delete-after-run, clear agent override, Cron-Optionen für exact/stagger,
  Überschreibungen für Agent-Modell/Thinking sowie Best-Effort-Auslieferungsschalter.
- Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Schaltfläche zum Speichern, bis sie korrigiert sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: gespeicherte Legacy-Jobs mit `notify: true` können bis zur Migration weiterhin `cron.webhook` verwenden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
- Ein erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
- Antworten von `chat.history` sind aus Sicherheitsgründen für die UI größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder abschneiden, umfangreiche Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- Vom Assistant generierte Bilder werden als verwaltete Medienreferenzen gespeichert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Reloads nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Antwort von `chat.history` erhalten bleiben.
- `chat.history` entfernt außerdem nur für die Anzeige gedachte Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-Modell-Steuer-Tokens und lässt Assistant-Einträge weg, deren kompletter sichtbarer Text nur aus dem exakten Silent-Token `NO_REPLY` / `no_reply` besteht.
- Während eines aktiven Sendevorgangs und der abschließenden Aktualisierung des Verlaufs hält die Chat-Ansicht lokale
  optimistische Benutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig
  einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald
  der Gateway-Verlauf aufgeholt hat.
- `chat.inject` hängt eine Assistant-Notiz an das Sitzungs-Transkript an und sendet ein `chat`-Ereignis für UI-only-Aktualisierungen (kein Agent-Lauf, keine Channel-Auslieferung).
- Die Modell- und Thinking-Auswahl im Chat-Header patcht die aktive Sitzung sofort über `sessions.patch`; es sind persistente Sitzungsüberschreibungen, keine Sendeoptionen nur für eine Runde.
- Wenn aktuelle Nutzungsberichte der Gateway-Sitzung hohen Kontextdruck anzeigen, zeigt der Chat-
  Composer-Bereich einen Kontexthinweis und bei empfohlenen Compaction-Stufen eine
  Compact-Schaltfläche, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-
  Snapshots werden ausgeblendet, bis das Gateway wieder aktuelle Nutzung meldet.
- Der Talk-Modus verwendet einen registrierten Realtime-Voice-Anbieter, der Browser-
  WebRTC-Sitzungen unterstützt. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus
  `talk.providers.openai.apiKey`, oder verwenden Sie die Voice-Call-Realtime-Anbieter-
  Konfiguration erneut. Der Browser erhält niemals den normalen OpenAI-API-Key; er erhält
  nur das kurzlebige Realtime-Client-Secret. Google Live Realtime Voice wird
  für backendseitige Voice Call- und Google Meet-Bridges unterstützt, aber noch nicht für diesen Browser-
  WebRTC-Pfad. Der Realtime-Sitzungsprompt wird vom Gateway zusammengestellt;
  `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Instruktionsüberschreibungen.
- Im Chat-Composer ist die Talk-Steuerung die Schaltfläche mit den Wellen neben der
  Mikrofon-Diktier-Schaltfläche. Wenn Talk startet, zeigt die Statuszeile des Composers
  `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder
  `Asking OpenClaw...`, während ein Realtime-Tool-Aufruf das konfigurierte
  größere Modell über `chat.send` konsultiert.
- Stoppen:
  - Klicken Sie auf **Stop** (ruft `chat.abort` auf)
  - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer Nachricht in der Warteschlange auf **Steer**, um diese Folgeanfrage in den laufenden Zug einzuschleusen.
  - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des Bandes abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen
- Teilweise Beibehaltung bei Abbruch:
  - Wenn ein Lauf abgebrochen wird, kann teilweise vorhandener Assistant-Text weiterhin in der UI angezeigt werden
  - Das Gateway speichert teilweise vorhandenen Assistant-Text aus abgebrochenen Läufen im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist
  - Gespeicherte Einträge enthalten Abbruch-Metadaten, sodass Transkript-Konsumenten Teilausgaben nach Abbruch von normal abgeschlossener Ausgabe unterscheiden können

## PWA-Installation und Web Push

Die Steuerungsoberfläche enthält eine `manifest.webmanifest` und einen Service Worker, sodass
moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem
Gateway, die installierte PWA mit Benachrichtigungen zu wecken, selbst wenn der Tab oder das
Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Beschreibung                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Klicks auf Benachrichtigungen verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-Statusverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Abonnement-Endpunkte.                        |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn
Sie Schlüssel fest vorgeben möchten (für Multi-Host-Deployments, Secret-Rotation oder
Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `mailto:openclaw@localhost`)

Die Steuerungsoberfläche verwendet diese über Scopes geschützten Gateway-Methoden, um Browser-Abonnements zu registrieren und
zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` sowie `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

Web Push ist unabhängig vom iOS-APNS-Relay-Pfad
(siehe [Configuration](/de/gateway/configuration) für Relay-gestütztes Push) und
von der bestehenden Methode `push.test`, die auf natives mobiles Pairing abzielt.

## Gehostete Embeds

Assistant-Nachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]`
rendern. Die iframe-Sandbox-Policy wird über
`gateway.controlUi.embedSandbox` gesteuert:

- `strict`: deaktiviert die Ausführung von Skripten innerhalb gehosteter Embeds
- `scripts`: erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist
  der Standard und reicht in der Regel für eigenständige Browser-Spiele/Widgets aus
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
Verhalten benötigt. Für die meisten agentgenerierten Spiele und interaktiven Canvases ist `scripts`
die sicherere Wahl.

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie
absichtlich möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Belassen Sie das Gateway auf loopback und lassen Sie Tailscale Serve es per HTTPS proxyen:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Standardmäßig können Anfragen der Steuerungsoberfläche/WebSocket-Serve über Tailscale-Identitäts-Header
(`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw
verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit
`tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die
Anfrage loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-
Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP
und denselben Auth-Umfang vor Schreibvorgängen zur Ratenbegrenzung serialisiert. Gleichzeitige fehlerhafte Wiederholungen
aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen
statt zwei einfache Nichtübereinstimmungen parallel gegeneinander laufen zu lassen.
Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code ausgeführt werden könnte, verlangen Sie Token-/Passwort-Authentifizierung.

### An Tailnet binden + Token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Öffnen Sie dann:

- `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Verbindungen der Steuerungsoberfläche ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Authentifizierung der Steuerungsoberfläche über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Insecure-Auth-Toggles:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` ist nur ein lokaler Kompatibilitätsschalter:

- Er erlaubt localhost-Sitzungen der Steuerungsoberfläche, in
  nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
- Er umgeht keine Pairing-Prüfungen.
- Er lockert keine Anforderungen an die Geräteidentität für entfernte Verbindungen (nicht localhost).

**Nur als Break-Glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität für die Steuerungsoberfläche und ist eine
schwerwiegende Sicherheitsabschwächung. Setzen Sie dies nach einer Notfallverwendung schnell wieder zurück.

Hinweis zu Trusted Proxy:

- erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Sitzungen der Steuerungsoberfläche ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Sitzungen der Steuerungsoberfläche mit Node-Rolle
- Reverse Proxys auf demselben Host über loopback erfüllen die Trusted-Proxy-Authentifizierung weiterhin nicht; siehe
  [Trusted proxy auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Steuerungsoberfläche wird mit einer strikten `img-src`-Policy ausgeliefert: Erlaubt sind nur Assets mit **gleicher Origin**, `data:`-URLs und lokal erzeugte `blob:`-URLs. Remote-`http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das praktisch bedeutet:

- Avatare und Bilder, die unter relativen Pfaden ausgeliefert werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Lokale `blob:`-URLs, die von der Steuerungsoberfläche erzeugt werden, werden weiterhin gerendert.
- Von Channel-Metadaten ausgegebene Remote-Avatar-URLs werden in den Avatar-Helfern der Steuerungsoberfläche entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keinen beliebigen Remote-Bildabruf aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Steuerungsoberfläche dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend zur benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route auf anderweitig geschützten Hosts die Agent-Identität preisgibt.
- Die Steuerungsoberfläche selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild in Dashboards weiterhin gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem Rest des Gateways.

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

Richten Sie dann die UI auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Steuerungsoberfläche besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
von der HTTP-Origin abweichen. Das ist praktisch, wenn Sie den Vite-Dev-Server
lokal verwenden, das Gateway aber anderswo läuft.

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
- `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, was Lecks in Request-Logs und im Referer vermeidet. Veraltete Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmalig importiert, aber nur als Fallback, und sofort nach dem Bootstrap entfernt.
- `password` wird nur im Speicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
- Deployments der Steuerungsoberfläche außerhalb von loopback müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Dies schließt entfernte Dev-Setups ein.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Es bedeutet, jede Browser-Origin zuzulassen, nicht „den jeweils verwendeten Host abgleichen“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den
  Host-Header-Origin-Fallback-Modus, aber das ist ein gefährlicher Sicherheitsmodus.

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
- [TUI](/de/web/tui) — Terminal User Interface
- [Health Checks](/de/gateway/health) — Überwachung des Gateway-Zustands
