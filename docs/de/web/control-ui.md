---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungs-UI für den Gateway (Chat, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-05-04T06:44:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07fbbe1c7fec5f67a04a231e02bdf0f7d16be9c5fe188915674d71fcd69002a5
    source_path: web/control-ui.md
    workflow: 16
---

The Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungspanel des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht persistiert. Das Onboarding erzeugt normalerweise beim ersten Verbindungsaufbau ein Gateway-Token für die Shared-Secret-Authentifizierung, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsgenehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): pairing required“

<Steps>
  <Step title="Ausstehende Anfragen auflisten">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Nach Anfrage-ID genehmigen">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff ändern, wird dies als Genehmigungsupgrade behandelt, nicht als stiller erneuter Verbindungsaufbau. OpenClaw hält die alte Genehmigung aktiv, blockiert die umfassendere erneute Verbindung und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn, Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Kopplungs-Roundtrip für Control-UI-Operatorsitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gilt, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindings, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordert ein Browserwechsel oder das Löschen von Browserdaten eine erneute Kopplung.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normalen Autorenschaftsmetadaten des Transkripts für Nachrichten hinaus persistiert, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Avatar-Überschreibung des Assistenten. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und durchlaufen niemals `config.patch`. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Laufzeit-Konfigurationsendpunkt

Die Control UI ruft ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt ist durch dieselbe Gateway-Authentifizierung geschützt wie der restliche HTTP-Bereich: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/-Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Gateway-Zugriff-Karte, nicht unter Darstellung.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht-englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für denselben nicht-englischen Locale-Satz generiert, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Publish-Repo generiert; sie erscheint möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungspanel enthält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importslot. Um ein Theme zu importieren, öffnen Sie den [tweakcn editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in Darstellung ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht zwischen Geräten synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen wechselt das aktive Theme zurück zu Claw, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmalig nutzbares Browser-Token über WebSocket, und rein backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.realtime.relay*`-RPCs streamt und `openclaw_agent_consult`-Toolaufrufe über `chat.send` für das größere konfigurierte OpenClaw-Modell zurücksendet.
    - Streamen Sie Toolaufrufe und Live-Tool-Ausgabekarten im Chat (Agentenereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Dreams">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Instanzen: Präsenzliste und Aktualisierung (`system-presence`).
    - Sitzungen: Liste und sitzungsbezogene Überschreibungen für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: Dreaming-Status, Aktivieren-/Deaktivieren-Schalter und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: Auflisten/Hinzufügen/Bearbeiten/Ausführen/Aktivieren/Deaktivieren und Ausführungshistorie (`cron.*`).
    - Skills: Status, Aktivieren/Deaktivieren, Installieren, API-Schlüsselaktualisierungen (`skills.*`).
    - Nodes: Liste und Caps (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists und Ask-Policy für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Anwenden und mit Validierung neu starten (`config.apply`) sowie die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurations-Payload; nicht auflösbare aktive übermittelte Refs werden vor dem Schreiben abgelehnt.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, unmittelbarer Kindzusammenfassungen, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositions-Nodes sowie Plugin- und Kanalschemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip besitzt.
    - Wenn ein Snapshot Raw-Text nicht sicher per Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Reset to saved“ im Raw-JSON-Editor bewahrt die raw-verfasste Form (Formatierung, Kommentare, `$include`-Layout), anstatt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher per Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um versehentliche Objekt-zu-String-Beschädigung zu verhindern.

  </Accordion>
  <Accordion title="Debug, Logs, Update">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignislog und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update ausführen und neu starten (`update.run`) mit einem Neustartbericht; anschließend nach der erneuten Verbindung `update.status` pollen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Panel">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf keine umschalten, wenn Sie rein interne Ausführungen möchten.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Jobs in der Hauptsitzung sind die Zustellmodi Webhook und keine verfügbar.
    - Erweiterte Bearbeitungssteuerungen umfassen Nach-Ausführung-löschen, Agentenüberschreibung löschen, exakte/gestaffelte Cron-Optionen, Agentenmodell-/Thinking-Überschreibungen und Best-Effort-Zustellungsschalter.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es ausgelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert werden.

  </Accordion>
</AccordionGroup>

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter (`[chat.history omitted: message too large]`) ersetzen.
    - Vom Assistenten generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass erneutes Laden nicht davon abhängt, dass rohe Base64-Bild-Payloads in der Chat-Verlaufsantwort verbleiben.
    - `chat.history` entfernt außerdem nur zur Anzeige gedachte Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Payloads von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzte Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur aus dem exakten stummen Token `NO_REPLY` / `no_reply` besteht.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse bilden den Zustellungsstatus ab, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Final-Ereignissen lädt die Control UI den Verlauf neu und führt nur ein kleines optimistisches Ende zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agentenlauf, keine Kanalzustellung).
    - Die Modell- und Denkmodus-Auswahlen im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine nur für einen Durchgang geltenden Sendeoptionen.
    - Wenn Sie `/new` in der Control UI eingeben, wird dieselbe frische Dashboard-Sitzung wie bei Neuer Chat erstellt und aktiviert. Bei Eingabe von `/reset` bleibt die explizite In-Place-Zurücksetzung des Gateways für die aktuelle Sitzung erhalten.
    - Die Chat-Modellauswahl fragt die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn aktuelle Gateway-Berichte zur Sitzungsnutzung hohen Kontextdruck anzeigen, zeigt der Chat-Composer-Bereich einen Kontext-Hinweis und bei empfohlenen Compaction-Stufen eine Compaction-Schaltfläche, die den normalen Pfad für Session-Compaction ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis das Gateway wieder aktuelle Nutzung meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder konfigurieren Sie Google mit `talk.provider: "google"` plus `talk.providers.google.apiKey`; die Echtzeit-Provider-Konfiguration von Voice Call kann weiterhin als Fallback wiederverwendet werden. Der Browser erhält niemals einen normalen Provider-API-Schlüssel. OpenAI erhält ein flüchtiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch das Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Anmeldedaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs läuft. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Im Chat-Composer ist die Talk-Steuerung die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Statuszeile des Composers `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `chat.send` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert den OpenAI-Browser-WebRTC-SDP-Austausch, die Google Live-Browser-WebSocket-Einrichtung mit eingeschränktem Token und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und Abbrechen">
    - Klicken Sie auf **Stoppen** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgefragen in die Warteschlange gestellt. Klicken Sie bei einer eingereihten Nachricht auf **Steuern**, um diese Folgefrage in den laufenden Durchgang einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchformulierungen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Aufbewahrung von Abbruch-Teilergebnissen">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistententext weiterhin in der UI angezeigt werden.
    - Das Gateway persistiert abgebrochenen teilweisen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten Abbruch-Teilergebnisse von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Mit Web Push kann das Gateway die installierte PWA mit Benachrichtigungen wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                           | Was sie tut                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | PWA-Manifest. Browser bieten "App installieren" an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                    | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-Zustandsverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar, das zum Signieren von Web Push-Payloads verwendet wird. |
| `push/web-push-subscriptions.json`                   | Persistierte Browser-Abonnement-Endpunkte.                         |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel fest vorgeben möchten (für Multi-Host-Deployments, Secrets-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `mailto:openclaw@localhost`)

Die Control UI verwendet diese bereichsbeschränkten Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relaygestützten Push) und von der bestehenden Methode `push.test`, die auf native mobile Kopplung abzielen.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die Iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung in gehosteten Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen, während die Origin-Isolierung erhalten bleibt; dies ist die Standardeinstellung und reicht normalerweise für eigenständige Browser-Spiele/-Widgets aus.
  </Tab>
  <Tab title="trusted">
    Fügt `allow-same-origin` zusätzlich zu `allow-scripts` für Same-Site-Dokumente hinzu, die bewusst stärkere Berechtigungen benötigen.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten von Agenten generierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chat-Nachrichtenbreite

Gruppierte Chat-Nachrichten verwenden eine gut lesbare standardmäßige Maximalbreite. Bereitstellungen auf breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentangaben wie `960px` oder `82%` sowie eingeschränkte `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- und `fit-content(...)`-Breitenausdrücke.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Belassen Sie das Gateway auf Loopback und lassen Sie Tailscale Serve es per HTTPS als Proxy bereitstellen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Standardmäßig können Control UI- und WebSocket-Serve-Anfragen sich über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem es die `x-forwarded-for`-Adresse mit `tailscale whois` auflöst und sie mit dem Header abgleicht, und akzeptiert diese nur, wenn die Anfrage über Loopback mit Tailscales `x-forwarded-*`-Headern eintrifft. Bei Control UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Device-Pairing-Roundtrip; gerätelose Browser und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code laufen könnte, verlangen Sie Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet + Token binden">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Fügen Sie den passenden gemeinsamen geheimen Schlüssel in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP (`http://<lan-ip>` oder `http://<tailscale-ip>`) öffnen, läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- nur für localhost geltende Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Control UI-Operatorauthentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

<AccordionGroup>
  <Accordion title="Verhalten des Insecure-auth-Schalters">
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

    - Er erlaubt localhost-Control UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht-localhost) Geräte.

  </Accordion>
  <Accordion title="Nur für den Notfallzugriff">
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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und stellt eine schwerwiegende Sicherheitsverschlechterung dar. Machen Sie dies nach einer Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu Trusted Proxy">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control UI-Sitzungen mit Node-Rolle.
    - local loopback-Reverse-Proxys auf demselben Host erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strikten `img-src`-Policy ausgeliefert: Nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal erzeugte `blob:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Channel-Metadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus dem Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route die Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem Rest des Gateways.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Dadurch bleibt das normale Medien-Rendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbare Medien-URLs aufzunehmen.

## UI erstellen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für die lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, das Gateway aber an anderer Stelle läuft.

<Steps>
  <Step title="UI-Dev-Server starten">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Mit gatewayUrl öffnen">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Optionale einmalige Authentifizierung (falls erforderlich):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Hinweise">
    - `gatewayUrl` wird nach dem Laden in localStorage gespeichert und aus der URL entfernt.
    - Wenn Sie einen vollständigen `ws://`- oder `wss://`-Endpunkt über `gatewayUrl` übergeben, URL-codieren Sie den Wert von `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrageprotokollen und über Referer vermieden werden. Ältere `?token=`-Query-Parameter werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und direkt nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfigurations- oder Umgebungsanmeldedaten zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-loopback-Control-UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit festlegen (vollständige Ursprünge). Dazu gehören auch entfernte Dev-Setups.
    - Beim Start des Gateway können lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und -Port übernommen werden, entfernte Browser-Ursprünge benötigen jedoch weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zuzulassen, nicht „den Host abzugleichen, den ich gerade verwende“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Host-Header-Origin-Fallback-Modus, ist jedoch ein gefährlicher Sicherheitsmodus.

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

Details zur Einrichtung des Remote-Zugriffs: [Remote-Zugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Zustandsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
