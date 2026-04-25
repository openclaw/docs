---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
summary: Browserbasierte Control UI für das Gateway (Chat, Nodes, Konfiguration)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T18:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
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

Die Authentifizierung wird beim WebSocket-Handshake bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identity-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identity-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfeld im Dashboard speichert ein Token für die aktuelle Browser-Tab-Sitzung
und die ausgewählte Gateway-URL; Passwörter werden nicht gespeichert. Das Onboarding
erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für Shared-Secret-Authentifizierung,
aber Passwort-Authentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Geräte-Pairing (erste Verbindung)

Wenn Sie sich mit der Control UI von einem neuen Browser oder Gerät verbinden, verlangt das Gateway
eine **einmalige Pairing-Genehmigung** — selbst wenn Sie sich im selben Tailnet
mit `gateway.auth.allowTailscale: true` befinden. Dies ist eine Sicherheitsmaßnahme, um
unautorisierten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): pairing required“

**So genehmigen Sie das Gerät:**

```bash
# Ausstehende Anfragen auflisten
openclaw devices list

# Nach Anfrage-ID genehmigen
openclaw devices approve <requestId>
```

Wenn der Browser Pairing mit geänderten Auth-Details erneut versucht (Rolle/Scopes/Public
Key), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId`
erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gepaart ist und Sie ihn von Lesezugriff auf
Schreib-/Admin-Zugriff ändern, wird dies als Genehmigungs-Upgrade und nicht als stilles
Neuverbinden behandelt. OpenClaw hält die alte Genehmigung aktiv, blockiert die breitere Verbindung erneut
und fordert Sie auf, den neuen Scope-Satz explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn,
Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe
[Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

**Hinweise:**

- Direkte lokale Browser-Verbindungen über local loopback (`127.0.0.1` / `localhost`) werden
  automatisch genehmigt.
- Browser-Verbindungen über Tailnet und LAN erfordern weiterhin eine explizite Genehmigung, selbst wenn
  sie vom selben Rechner stammen.
- Jedes Browser-Profil erzeugt eine eindeutige Geräte-ID, daher erfordern Browserwechsel oder
  das Löschen von Browserdaten ein erneutes Pairing.

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und
Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen hinzugefügt wird. Sie
liegt im Browser-Speicher, ist auf das aktuelle Browser-Profil beschränkt und wird nicht mit
anderen Geräten synchronisiert oder serverseitig gespeichert, abgesehen von den normalen Metadaten zur
Transkript-Urheberschaft bei Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder
das Wechseln des Browsers setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistant-Avatars.
Hochgeladene Assistant-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen
Browser und werden niemals über `config.patch` zurückgeschrieben. Das gemeinsam genutzte
Konfigurationsfeld `ui.assistant.avatar` ist weiterhin für Nicht-UI-Clients verfügbar,
die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Laufzeit-Konfigurationsendpunkt

Die Control UI lädt ihre Laufzeiteinstellungen von
`/__openclaw/control-ui-config.json`. Dieser Endpunkt wird durch dieselbe
Gateway-Authentifizierung wie der Rest der HTTP-Oberfläche geschützt: nicht authentifizierte Browser können
ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-
Token/Passwort, eine Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden basierend auf Ihrer Browser-Sprache lokalisieren.
Um dies später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Der
Sprachauswähler befindet sich auf der Karte Gateway Access, nicht unter Appearance.

- Unterstützte Gebietsschemata: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Nicht-englische Übersetzungen werden verzögert im Browser geladen.
- Das ausgewählte Gebietsschema wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

- Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Direkt aus dem Browser über WebRTC mit OpenAI Realtime sprechen. Das Gateway
  erstellt mit `talk.realtime.session` ein kurzlebiges Realtime-Client-Secret; der
  Browser sendet Mikrofon-Audio direkt an OpenAI und leitet
  `openclaw_agent_consult`-Tool-Calls über `chat.send` an das größere
  konfigurierte OpenClaw-Modell zurück.
- Tool-Calls und Live-Tool-Ausgabekarten im Chat streamen (Agent-Ereignisse)
- Kanäle: integrierte sowie gebündelte/externe Plugin-Kanalstatus, QR-Login und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`)
- Instanzen: Presence-Liste + Aktualisierung (`system-presence`)
- Sitzungen: Liste + sitzungsspezifische Überschreibungen für Modell/Thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`)
- Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`)
- Nodes: Liste + Caps (`node.list`)
- Exec-Genehmigungen: Allowlists und Ask-Richtlinie für Gateway oder Node bearbeiten für `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguration: `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`)
- Konfiguration: anwenden + Neustart mit Validierung (`config.apply`) und die zuletzt aktive Sitzung aufwecken
- Konfigurationsschreibvorgänge enthalten einen Base-Hash-Schutz, um konkurrierende Bearbeitungen nicht zu überschreiben
- Konfigurationsschreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen außerdem vorab die Auflösung aktiver `SecretRef`-Einträge in der übermittelten Konfigurations-Payload; nicht aufgelöste aktive übermittelte Refs werden vor dem Schreiben abgelehnt
- Konfigurationsschema + Formular-Rendering (`config.schema` / `config.schema.lookup`,
  einschließlich Feld-`title` / `description`, passender UI-Hinweise, Zusammenfassungen unmittelbarer untergeordneter Elemente, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten
  sowie Plugin- und Kanalschemata, sofern verfügbar); ein roher JSON-Editor ist
  nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat
- Wenn ein Snapshot nicht sicher als Rohtext roundtripfähig ist, erzwingt Control UI den Formularmodus und deaktiviert den Rohmodus für diesen Snapshot
- „Auf gespeichert zurücksetzen“ im rohen JSON-Editor bewahrt die roh verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen ein Zurücksetzen überstehen, wenn der Snapshot sicher roundtripfähig ist
- Strukturierte `SecretRef`-Objektwerte werden in Textfeldern des Formulars schreibgeschützt gerendert, um versehentliche Beschädigung von Objekt-zu-String zu verhindern
- Debug: Status-/Health-/Modelle-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`)
- Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`)
- Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit Neustartbericht

Hinweise zum Bereich Cron-Jobs:

- Bei isolierten Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf none umstellen, wenn Sie nur interne Läufe möchten.
- Felder für Kanal/Ziel erscheinen, wenn announce ausgewählt ist.
- Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
- Für Hauptsitzungs-Jobs sind die Zustellmodi webhook und none verfügbar.
- Erweiterte Bearbeitungsoptionen umfassen delete-after-run, clear agent override, genaue/gestaffelte Cron-Optionen,
  Überschreibungen für Agent-Modell/Thinking und Best-Effort-Zustellungsumschalter.
- Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert sind.
- Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es fehlt, wird der Webhook ohne Auth-Header gesendet.
- Veralteter Fallback: gespeicherte alte Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert werden.

## Chat-Verhalten

- `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
- Ein erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
- Antworten von `chat.history` sind aus Sicherheitsgründen für die UI größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder abschneiden, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
- Vom Assistant erzeugte Bilder werden als verwaltete Medienreferenzen gespeichert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Reloads nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Chat-Verlauf-Antwort erhalten bleiben.
- `chat.history` entfernt außerdem nur für die Anzeige bestimmte Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-Tool-Call-XML-Payloads (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-Modellsteuerungs-Token und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur aus dem exakten Silent-Token `NO_REPLY` / `no_reply` besteht.
- Während eines aktiven Sendevorgangs und der abschließenden Aktualisierung des Verlaufs hält die Chat-Ansicht lokale optimistische Benutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
- `chat.inject` hängt eine Assistant-Notiz an das Sitzungs-Transkript an und sendet ein `chat`-Ereignis für UI-only-Updates (kein Agent-Lauf, keine Kanalauslieferung).
- Die Auswahlfelder für Modell und Thinking im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; es sind persistente Sitzungsüberschreibungen, keine Optionen nur für einen einzelnen Sendevorgang.
- Wenn aktuelle Gateway-Sitzungsnutzungsberichte hohen Kontextdruck zeigen, zeigt der Bereich des Chat-Editors einen Kontexthinweis und bei empfohlenen Compaction-Stufen eine Compact-Schaltfläche an, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis das Gateway wieder aktuelle Nutzung meldet.
- Der Talk-Modus verwendet einen registrierten Realtime-Voice-Provider, der Browser-WebRTC-Sitzungen unterstützt. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder verwenden Sie die Konfiguration des Realtime-Providers von Voice Call wieder. Der Browser erhält niemals den normalen OpenAI-API-Schlüssel; er erhält nur das kurzlebige Realtime-Client-Secret. Google-Live-Realtime-Voice wird für Backend-Voice-Call- und Google-Meet-Bridges unterstützt, aber noch nicht für diesen Browser-WebRTC-Pfad. Der Realtime-Sitzungs-Prompt wird vom Gateway zusammengesetzt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Überschreibungen für Anweisungen.
- Im Chat-Editor ist das Talk-Steuerelement die Schaltfläche mit den Wellen neben der Mikrofon-Diktier-Schaltfläche. Wenn Talk startet, zeigt die Statuszeile des Editors `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Realtime-Tool-Call das konfigurierte größere Modell über `chat.send` konsultiert.
- Stopp:
  - Auf **Stop** klicken (ruft `chat.abort` auf)
  - Während ein Lauf aktiv ist, werden normale Folgeaktionen in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steer**, um diese Folgeaktion in den laufenden Turn einzuspeisen.
  - `/stop` eingeben (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des Bandes abzubrechen
  - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen
- Beibehaltung von Teilinhalten bei Abbruch:
  - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden
  - Das Gateway speichert bei gepuffertem Output teilweise Assistant-Texte abgebrochener Läufe im Transkript-Verlauf
  - Persistierte Einträge enthalten Abbruch-Metadaten, damit Transkript-Konsumenten Teilinhalte aus Abbrüchen von normalem Abschluss-Output unterscheiden können

## PWA-Installation und Web Push

Die Control UI liefert eine `manifest.webmanifest` und einen Service Worker aus, sodass
moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem
Gateway, die installierte PWA mit Benachrichtigungen zu wecken, selbst wenn weder Tab noch
Browserfenster geöffnet sind.

| Oberfläche                                            | Was sie tut                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-Statusverzeichnis) | Automatisch erzeugtes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscriptions-Endpunkte.                    |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn
Sie Schlüssel fixieren möchten (für Multi-Host-Deployments, Rotation von Secrets oder
Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `mailto:openclaw@localhost`)

Die Control UI verwendet diese scopegeschützten Gateway-Methoden, um Browser-Subscriptions zu registrieren und
zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

Web Push ist unabhängig vom iOS-APNS-Relay-Pfad
(siehe [Konfiguration](/de/gateway/configuration) für relaygestützten Push) und
der bestehenden Methode `push.test`, die auf natives mobiles Pairing zielen.

## Gehostete Embeds

Assistant-Nachrichten können mit dem Shortcode `[embed ...]` gehostete Webinhalte inline rendern.
Die iframe-Sandbox-Richtlinie wird über
`gateway.controlUi.embedSandbox` gesteuert:

- `strict`: deaktiviert Skriptausführung innerhalb gehosteter Embeds
- `scripts`: erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist
  der Standard und reicht in der Regel für in sich geschlossene Browser-Spiele/Widgets aus
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

Verwenden Sie `trusted` nur dann, wenn das eingebettete Dokument tatsächlich Same-Origin-
Verhalten benötigt. Für die meisten agentengenerierten Spiele und interaktiven Canvases ist `scripts`
die sicherere Wahl.

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie
absichtlich möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

### Integriertes Tailscale Serve (bevorzugt)

Lassen Sie das Gateway auf Loopback und lassen Sie Tailscale Serve es per HTTPS proxien:

```bash
openclaw gateway --tailscale serve
```

Öffnen Sie:

- `https://<magicdns>/` (oder den konfigurierten `gateway.controlUi.basePath`)

Standardmäßig können sich Anfragen von Control UI/WebSocket Serve über Tailscale-Identity-Header
(`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw
verifiziert die Identität, indem es die `x-forwarded-for`-Adresse mit
`tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die
Anfrage Loopback mit Tailscales `x-forwarded-*`-Headern trifft. Setzen Sie
`gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-
Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder
`"password"`.
Für diesen asynchronen Serve-Identity-Pfad werden fehlgeschlagene Auth-Versuche für dieselbe Client-IP
und denselben Auth-Scope vor dem Schreiben der Ratenbegrenzung serialisiert. Gleichzeitige fehlerhafte Wiederholungen
aus demselben Browser können daher bei der zweiten Anfrage `retry later` zeigen,
statt dass zwei einfache Mismatches parallel gegeneinander laufen.
Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code laufen kann, verlangen Sie Token-/Passwort-Authentifizierung.

### An Tailnet + Token binden

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Dann öffnen Sie:

- `http://<tailscale-ip>:18789/` (oder den konfigurierten `gateway.controlUi.basePath`)

Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als
`connect.params.auth.token` oder `connect.params.auth.password`).

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`),
läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig
**blockiert** OpenClaw Verbindungen zur Control UI ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass-Option `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** HTTPS verwenden (Tailscale Serve) oder die UI lokal öffnen:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

**Verhalten des Schalters für unsichere Authentifizierung:**

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

- Er erlaubt localhost-Control-UI-Sitzungen, in
  nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
- Er umgeht keine Pairing-Prüfungen.
- Er lockert die Anforderungen an die Geräteidentität für Remote-Zugriffe (nicht localhost) nicht.

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

`dangerouslyDisableDeviceAuth` deaktiviert Prüfungen der Geräteidentität für die Control UI und ist eine
schwere Sicherheitsverschlechterung. Nach Notfallnutzung schnell zurücksetzen.

Hinweis zu Trusted Proxy:

- erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne
  Geräteidentität zulassen
- dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle
- Reverse-Proxys mit Loopback auf demselben Host erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe
  [Trusted-Proxy-Auth](/de/gateway/trusted-proxy-auth)

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Nur **same-origin**-Assets, `data:`-URLs und lokal erzeugte `blob:`-URLs sind erlaubt. Remote-`http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden ausgeliefert werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Remote-Avatar-URLs aus Kanalmetadaten werden in den Avatar-Helpern der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen Remote-Bildabrufe aus dem Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dies verhindert, dass die Avatar-Route die Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet das Gateway-Token beim Abrufen von Avataren als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route entsprechend dem Rest des Gateways nicht authentifiziert.

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

```bash
pnpm ui:build
```

Optionaler absoluter Basispfad (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Verweisen Sie dann die UI auf Ihre Gateway-WS-URL (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + Remote-Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann
sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server
lokal wollen, das Gateway aber anderswo läuft.

1. UI-Dev-Server starten: `pnpm ui:dev`
2. Eine URL wie diese öffnen:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optionale einmalige Authentifizierung (falls erforderlich):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Hinweise:

- `gatewayUrl` wird nach dem Laden in `localStorage` gespeichert und aus der URL entfernt.
- `token` sollte wenn möglich über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfragelogs und Referer vermieden werden. Alte `?token=`-Query-Parameter werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und sofort nach dem Bootstrap entfernt.
- `password` wird nur im Speicher gehalten.
- Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
  Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
- Verwenden Sie `wss://`, wenn das Gateway hinter TLS steht (Tailscale Serve, HTTPS-Proxy usw.).
- `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
- Nicht auf Loopback beschränkte Control-UI-Deployments müssen `gateway.controlUi.allowedOrigins`
  explizit setzen (vollständige Origins). Dazu gehören auch Remote-Dev-Setups.
- Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte
  lokale Tests. Es bedeutet, jeden Browser-Origin zuzulassen, nicht „mit jedem Host übereinstimmen, den ich
  verwende“.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert
  den Host-Header-Origin-Fallback-Modus, aber das ist ein gefährlicher Sicherheitsmodus.

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

Details zur Einrichtung des Fernzugriffs: [Remote-Zugriff](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [Integritätsprüfungen](/de/gateway/health) — Gateway-Integritätsüberwachung
