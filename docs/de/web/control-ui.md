---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Control UI für das Gateway (Chat, Nodes, Konfiguration)
title: Control UI
x-i18n:
    generated_at: "2026-04-26T11:41:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

Die Control UI ist eine kleine Single-Page-App auf Basis von **Vite + Lit**, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: Setzen Sie `gateway.controlUi.basePath` (z. B. `/openclaw`)

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

Das Einstellungsfenster des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht gespeichert. Das Onboarding generiert normalerweise beim ersten Verbindungsaufbau ein Gateway-Token für Shared-Secret-Auth, aber Passwort-Auth funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` steht.

## Geräte-Pairing (erste Verbindung)

Wenn Sie die Control UI von einem neuen Browser oder Gerät aus verbinden, verlangt das Gateway normalerweise eine **einmalige Pairing-Genehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen werden:** „disconnected (1008): pairing required“

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Wenn der Browser das Pairing mit geänderten Auth-Details (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gepairt ist und Sie ihn von Lesezugriff auf Schreib-/Admin-Zugriff ändern, wird dies als Upgrade der Genehmigung behandelt, nicht als stilles Reconnect. OpenClaw lässt die alte Genehmigung aktiv, blockiert das Reconnect mit den erweiterten Rechten und fordert Sie auf, den neuen Scope-Satz explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn, Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte lokale Browserverbindungen über Loopback (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Pairing-Roundtrip für Operator-Sitzungen der Control UI überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität präsentiert.
- Direkte Tailnet-Binds, Browserverbindungen über LAN und Browserprofile ohne Geräteidentität erfordern weiterhin eine explizite Genehmigung.
- Jedes Browserprofil generiert eine eindeutige Geräte-ID, daher erfordern ein Browserwechsel oder das Löschen von Browserdaten ein erneutes Pairing.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen beigefügt wird. Sie lebt im Browser-Speicher, ist auf das aktuelle Browserprofil begrenzt und wird weder mit anderen Geräten synchronisiert noch serverseitig gespeichert — abgesehen von den normalen Metadaten zur Autorenschaft im Transkript für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistant-Avatars. Hochgeladene Assistant-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und werden niemals über `config.patch` round-tripped. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt weiterhin für Nicht-UI-Clients verfügbar, die dieses Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Endpunkt für Laufzeitkonfiguration

Die Control UI lädt ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json`. Dieser Endpunkt ist durch dieselbe Gateway-Authentifizierung geschützt wie der Rest der HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/-Passwort, Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihres Browser-Gebietsschemas lokalisieren. Um dies später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Der Locale-Picker befindet sich in der Karte „Gateway Access“, nicht unter „Appearance“.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Nicht-englische Übersetzungen werden lazy im Browser geladen.
- Das ausgewählte Gebietsschema wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

## Was sie heute kann

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Mit dem Modell über Gateway-WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Direkt aus dem Browser über WebRTC mit OpenAI Realtime sprechen. Das Gateway erzeugt mit `talk.realtime.session` ein kurzlebiges Realtime-Client-Secret; der Browser sendet Mikrofon-Audio direkt an OpenAI und leitet Tool-Aufrufe von `openclaw_agent_consult` über `chat.send` zurück an das größere konfigurierte OpenClaw-Modell.
    - Tool-Aufrufe + Live-Karten mit Tool-Ausgabe im Chat streamen (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: integrierte sowie gebündelte/externe Plugin-Channel-Status, QR-Login und Konfiguration pro Channel (`channels.status`, `web.login.*`, `config.patch`).
    - Instanzen: Presence-Liste + Aktualisierung (`system-presence`).
    - Sitzungen: Liste + Überschreibungen pro Sitzung für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Reader für das Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, Aktualisierungen von API-Schlüsseln (`skills.*`).
    - Nodes: auflisten + Caps (`node.list`).
    - Exec-Genehmigungen: Allowlists für Gateway oder Node bearbeiten + Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Mit Validierung anwenden + neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um konkurrierende Änderungen nicht zu überschreiben.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Referenzen in der übergebenen Konfigurationsnutzlast; nicht aufgelöste aktive übergebene Referenzen werden vor dem Schreiben abgelehnt.
    - Schema + Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, Zusammenfassungen unmittelbarer Child-Elemente, Doku-Metadaten zu verschachtelten Objekt-/Wildcard-/Array-/Kompositions-Knoten sowie Plugin- + Channel-Schemas, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot ein sicheres Raw-Roundtrip unterstützt.
    - Wenn ein Snapshot keinen sicheren Raw-Roundtrip zulässt, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Reset to saved“ im Raw-JSON-Editor bewahrt die raw verfasste Form (Formatierung, Kommentare, `$include`-Layout), anstatt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen einen Reset überstehen, wenn der Snapshot sicher round-trippable ist.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Textfeldern schreibgeschützt gerendert, um versehentliche Beschädigungen durch Objekt-zu-String-Konvertierung zu verhindern.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: Snapshots von Status/Health/Modellen + Ereignislog + manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Logs: Live-Tail von Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit Neustartbericht.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf die Ankündigung einer Zusammenfassung eingestellt. Sie können auf none umschalten, wenn Sie nur interne Ausführungen möchten.
    - Felder für Channel/Ziel werden angezeigt, wenn announce ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to` als gültiger HTTP(S)-Webhook-URL.
    - Für Main-Session-Jobs sind die Zustellmodi webhook und none verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen delete-after-run, clear agent override, exakte/gestaffelte Cron-Optionen, Überschreibungen für Agent-Modell/Thinking und Best-Effort-Zustellungs-Toggles.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Schaltfläche zum Speichern, bis sie korrigiert sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es fehlt, wird der Webhook ohne Auth-Header gesendet.
    - Veraltetes Fallback: gespeicherte ältere Jobs mit `notify: true` können bis zur Migration weiterhin `cron.webhook` verwenden.

  </Accordion>
</AccordionGroup>

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - Ein erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - Antworten von `chat.history` sind aus Sicherheitsgründen für die UI größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, schwere Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Assistant-/generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Reloads nicht davon abhängen, dass rohe Base64-Bildnutzlasten in der Antwort von `chat.history` erhalten bleiben.
    - `chat.history` entfernt außerdem Inline-Direktiv-Tags nur für die Anzeige aus sichtbarem Assistant-Text (z. B. `[[reply_to_*]]` und `[[audio_as_voice]]`), XML-Nutzlasten für Tool-Aufrufe im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-Steuerungstokens des Modells und lässt Assistant-Einträge aus, deren kompletter sichtbarer Text nur aus dem exakten stillen Token `NO_REPLY` / `no_reply` besteht.
    - Während eines aktiven Sendens und des finalen Verlaufs-Refreshs hält die Chat-Ansicht lokale optimistische Benutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - `chat.inject` hängt eine Assistant-Notiz an das Sitzungs-Transkript an und sendet ein `chat`-Ereignis für UI-only-Aktualisierungen (kein Agent-Run, keine Channel-Zustellung).
    - Die Picker für Modell und Thinking in der Chat-Kopfzeile patchen die aktive Sitzung sofort über `sessions.patch`; es sind persistente Überschreibungen pro Sitzung, keine nur für einen Turn geltenden Sendeoptionen.
    - Wenn frische Nutzungsberichte des Gateway für die Sitzung hohen Kontextdruck melden, zeigt der Bereich des Chat-Composers einen Kontexthinweis an und bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Pfad für Session-Compaction ausführt. Veraltete Token-Snapshots werden verborgen, bis das Gateway erneut frische Nutzung meldet.

  </Accordion>
  <Accordion title="Talk mode (browser WebRTC)">
    Der Talk mode verwendet einen registrierten Echtzeit-Sprachprovider, der Browser-WebRTC-Sitzungen unterstützt. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder verwenden Sie die Konfiguration des Echtzeit-Providers von Voice Call erneut. Der Browser erhält niemals den normalen OpenAI-API-Schlüssel; er erhält nur das kurzlebige Realtime-Client-Secret. Google-Live-Echtzeit-Sprachverarbeitung wird für backendseitige Voice Call- und Google-Meet-Bridges unterstützt, aber noch nicht für diesen Browser-WebRTC-Pfad. Der Prompt für die Realtime-Sitzung wird vom Gateway zusammengestellt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Überschreibungen für Anweisungen.

    Im Chat-Composer ist die Talk-Steuerung die Wellen-Schaltfläche neben der Mikrofon-Schaltfläche für Diktat. Wenn Talk startet, zeigt die Statuszeile des Composers `Connecting Talk...`, dann `Talk live`, solange Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `chat.send` konsultiert.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während eine Ausführung aktiv ist, werden normale Folgeeingaben in die Warteschlange gestellt. Klicken Sie bei einer eingereihten Nachricht auf **Steer**, um diese Folgeeingabe in den laufenden Turn zu injizieren.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um Out-of-Band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Ausführungen für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Wenn eine Ausführung abgebrochen wird, kann partieller Assistant-Text weiterhin in der UI angezeigt werden.
    - Das Gateway persistiert abgebrochenen partiellen Assistant-Text im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruch-Metadaten, damit Transkript-Konsumenten abgebrochene Partials von normal abgeschlossener Ausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI enthält eine `manifest.webmanifest` und einen Service Worker, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA per Benachrichtigung zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                           | Funktion                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | PWA-Manifest. Browser bieten „Install app“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                    | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-Zustandsverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzlasten. |
| `push/web-push-subscriptions.json`                   | Persistierte Browser-Subscriptions-Endpunkte.                      |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie feste Schlüssel verwenden möchten (für Multi-Host-Deployments, Secrets-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `mailto:openclaw@localhost`)

Die Control UI verwendet diese scope-gesteuerten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Configuration](/de/gateway/configuration) für Relay-gestützten Push) und von der bestehenden Methode `push.test`, die auf natives mobiles Pairing zielen.
</Note>

## Gehostete Embeds

Assistant-Nachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die Iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Embeds.
  </Tab>
  <Tab title="scripts (default)">
    Erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist der Standard und reicht normalerweise für in sich geschlossene Browser-Spiele/Widgets aus.
  </Tab>
  <Tab title="trusted">
    Fügt `allow-same-origin` zusätzlich zu `allow-scripts` für Same-Site-Dokumente hinzu, die absichtlich stärkere Berechtigungen benötigen.
  </Tab>
</Tabs>

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

<Warning>
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten vom Agenten generierten Spiele und interaktiven Canvas-Inhalte ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie absichtlich möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Lassen Sie das Gateway auf Loopback und lassen Sie Tailscale Serve es per HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Standardmäßig können Anfragen von Control UI/WebSocket Serve über Tailscale-Identitäts-Header authentifiziert werden (`tailscale-user-login`), wenn `gateway.auth.allowTailscale` auf `true` steht. OpenClaw verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit `tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die Anfrage Loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Für Operator-Sitzungen der Control UI mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad auch den Device-Pairing-Roundtrip; Browser ohne Geräteidentität und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope vor Schreibvorgängen für Rate Limits serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Mismatches parallel gegeneinander laufen.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code ausgeführt werden kann, verlangen Sie Token-/Passwort-Auth.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Verbindungen der Control UI ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Auth über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` ist nur ein lokaler Kompatibilitäts-Toggle:

    - Es erlaubt localhost-Control-UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Es umgeht Pairing-Prüfungen nicht.
    - Es lockert die Anforderungen an Geräteidentität für entfernte Verbindungen (nicht localhost) nicht.

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität in der Control UI und ist eine erhebliche Sicherheitsabschwächung. Setzen Sie dies nach einer Notfallverwendung schnell wieder zurück.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Sitzungen der Control UI ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Loopback-Reverse-Proxys auf demselben Host erfüllen Trusted-Proxy-Auth weiterhin nicht; siehe [Trusted proxy auth](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zum HTTPS-Setup.

## Content Security Policy

Die Control UI wird mit einer strikten Richtlinie `img-src` ausgeliefert: Erlaubt sind nur Assets mit **gleicher Origin**, `data:`-URLs und lokal erzeugte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-URLs vom Typ `data:image/...` werden weiterhin gerendert (nützlich für Nutzlasten im Protokoll).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs aus Channel-Metadaten werden in den Avatar-Helpern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Auth konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten Route für Assistant-Medien). Dies verhindert, dass die Avatar-Route die Identität von Agenten auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Auth deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, im Einklang mit dem Rest des Gateway.

## Die UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Testing: Dev-Server + Remote-Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich von der HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, das Gateway aber anderswo läuft.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Optionale einmalige Authentifizierung (falls erforderlich):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` wird nach dem Laden in `localStorage` gespeichert und aus der URL entfernt.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und über den Referer vermieden werden. Veraltete Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und sofort nach dem Bootstrap entfernt.
    - `password` wird nur im Speicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfiguration oder Umgebungs-Credentials zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht über Loopback erreichbare Deployments der Control UI müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Origins). Das gilt auch für Remote-Dev-Setups.
    - Beim Gateway-Start können lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Laufzeit-Bind und Port initialisiert werden, aber entfernte Browser-Origins benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jede Browser-Origin zu erlauben, nicht „mit dem jeweils verwendeten Host abgleichen“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Host-Header-Origin-Fallback-Modus, ist aber ein gefährlicher Sicherheitsmodus.

  </Accordion>
</AccordionGroup>

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

Details zum Setup für den Fernzugriff: [Remote access](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Überwachung des Gateway-Zustands
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
