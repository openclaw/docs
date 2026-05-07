---
read_when:
    - Sie möchten das Gateway über einen Browser betreiben
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungs-UI für das Gateway (Chat, Nodes, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-05-07T13:27:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- Optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfenster des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Beim Onboarding wird beim ersten Verbindungsaufbau normalerweise ein Gateway-Token für die Shared-Secret-Authentifizierung erzeugt, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie von einem neuen Browser oder Gerät aus eine Verbindung zur Control UI herstellen, verlangt das Gateway normalerweise eine **einmalige Kopplungsgenehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Ausstehende Anfragen auflisten">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Per Anfrage-ID genehmigen">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Berechtigungsumfänge/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff umstellen, wird dies als Genehmigungs-Upgrade behandelt, nicht als stiller Wiederverbindungsaufbau. OpenClaw behält die alte Genehmigung aktiv, blockiert die umfassendere Wiederverbindung und fordert Sie auf, den neuen Berechtigungsumfang ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn, Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Informationen zur Token-Rotation und zum Widerruf finden Sie unter [Geräte-CLI](/de/cli/devices).

<Note>
- Direkte Browserverbindungen über local loopback (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Kopplungsdurchlauf für Control UI-Bedienersitzungen überspringen, wenn `gateway.auth.allowTailscale: true` ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordert ein Browserwechsel oder das Löschen von Browserdaten eine erneute Kopplung.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine browserbezogene persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsamen Sitzungen angehängt wird. Sie befindet sich im Browser-Speicher, ist auf das aktuelle Browserprofil beschränkt und wird nicht mit anderen Geräten synchronisiert oder serverseitig dauerhaft gespeichert, außer in den normalen Autorenschaftsmetadaten des Transkripts für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und durchlaufen nie `config.patch`. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt weiterhin für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (etwa skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Endpunkt für Laufzeitkonfiguration

Die Control UI ruft ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Karte „Gateway-Zugriff“, nicht unter „Darstellung“.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser verzögert geladen.
- Die ausgewählte Locale wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für dieselbe nicht englische Locale-Gruppe generiert, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentationen werden weiterhin im Veröffentlichungs-Repo generiert; sie erscheinen möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungsfenster enthält weiterhin die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importplatz. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in „Darstellung“ ein. Der Importer akzeptiert auch `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Platz; das Leeren schaltet das aktive Theme wieder auf Claw zurück, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Sprache">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Aktualisierungen des Chatverlaufs fordern ein begrenztes aktuelles Fenster mit Textbegrenzungen pro Nachricht an, sodass große Sitzungen den Browser nicht zwingen, eine vollständige Transkript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmaliges Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt und `openclaw_agent_consult`-Provider-Toolaufrufe über `talk.client.toolCall` für die Gateway-Richtlinie und das größere konfigurierte OpenClaw-Modell weiterleitet.
    - Streamen Sie Toolaufrufe und Live-Tool-Ausgabekarten im Chat (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: integrierte sowie gebündelte/externe Plugin-Kanalstatus, QR-Anmeldung und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Aktualisierungen von Kanalprüfungen halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und Teilsnapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit ihr UI-Budget überschreitet.
    - Instanzen: Anwesenheitsliste und Aktualisierung (`system-presence`).
    - Sitzungen: Listet standardmäßig konfigurierte Agent-Sitzungen auf, fällt von veralteten unkonfigurierten Agent-Sitzungsschlüsseln zurück und wendet sitzungsbezogene Überschreibungen für Modell/Thinking/Fast/Verbose/Trace/Reasoning an (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Aktivieren-/Deaktivieren-Schalter und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: auflisten und Begrenzungen (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Zulassungslisten und Abfragerichtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Anwenden und mit Validierung neu starten (`config.apply`) sowie die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die Auflösung aktiver SecretRef-Verweise für Referenzen in der übermittelten Konfigurationsnutzlast; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld `title` / `description`, passender UI-Hinweise, direkter untergeordneter Zusammenfassungen, Dokumentationsmetadaten für verschachtelte Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- und Kanalschemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Rohtext nicht sicher im Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert für diesen Snapshot den Raw-Modus.
    - „Auf gespeichert zurücksetzen“ im Raw-JSON-Editor bewahrt die raw-verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher im Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formulartexteingaben schreibgeschützt dargestellt, um versehentliche Objekt-zu-String-Beschädigungen zu verhindern.

  </Accordion>
  <Accordion title="Debug, Logs, Update">
    - Debug: Status-/Health-/Modellsnapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control UI-Aktualisierungs-/RPC-Zeitmessungen, langsame Chat-/Konfigurations-Renderzeiten und Browser-Reaktionsfähigkeitseinträge für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update und Neustart ausführen (`update.run`) mit Neustartbericht, danach nach der Wiederverbindung `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Fenster">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Ankündigungszusammenfassung eingestellt. Sie können auf „keine“ umstellen, wenn Sie rein interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn „Ankündigen“ ausgewählt ist.
    - Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Hauptsitzungs-Jobs sind die Zustellmodi Webhook und „keine“ verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Nach-Ausführung-löschen, Agent-Überschreibung löschen, Cron-Exact-/Stagger-Optionen, Überschreibungen für Agent-Modell/Thinking sowie Best-Effort-Zustellungsschalter.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können bis zur Migration weiterhin `cron.webhook` verwenden.

  </Accordion>
</AccordionGroup>

## Chatverhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
    - `chat.history`-Antworten sind aus UI-Sicherheitsgründen größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, große Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Vom Assistenten generierte Bilder werden als verwaltete Medienreferenzen gespeichert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Neuladungen nicht davon abhängen, dass rohe Base64-Bildnutzdaten in der Chat-Verlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI rein anzeigebezogene Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modell-Steuertokens und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendens und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind Zustellungsstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Final-Ereignissen lädt die Control UI den Verlauf neu und führt nur ein kleines optimistisches Ende zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agentenlauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agentenfilter vor der Sitzungsauswahl, und die Sitzungsauswahl ist auf den ausgewählten Agenten beschränkt. Beim Wechseln von Agenten werden nur Sitzungen angezeigt, die mit diesem Agenten verknüpft sind, und es wird auf die Hauptsitzung dieses Agenten zurückgegriffen, wenn noch keine gespeicherten Dashboard-Sitzungen vorhanden sind.
    - Auf Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; Hochscrollen, Zurückkehren nach oben oder Erreichen des unteren Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte Nur-Text-Nachrichten werden als eine Sprechblase mit einem Zählabzeichen gerendert. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht zusammengeklappt.
    - Die Modell- und Denk-Auswahlen im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine nur für einen Durchlauf geltenden Sendeoptionen.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe neue Dashboard-Sitzung wie Neuer Chat und wechselt dorthin. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateway für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateway an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Zulassungsliste die Auswahl. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn aktuelle Gateway-Sitzungsnutzungsberichte aktuelle Kontexttokens enthalten, zeigt der Chat-Composer-Bereich eine kompakte Kontextnutzungsanzeige. Bei hohem Kontextdruck wechselt sie zu Warn-Styling und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzungspfad für Compaction ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis das Gateway wieder aktuelle Nutzung meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus `talk.realtime.providers.openai.apiKey` oder Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen Standard-Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmal verwendbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Anmeldedaten und Anbieter-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Im Chat-Composer ist die Talk-Steuerung die Wellen-Schaltfläche neben der Mikrofon-Diktatschaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `talk.client.toolCall` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Browser-WebSocket-Einrichtung mit eingeschränktem Token und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und Abbrechen">
    - Klicken Sie auf **Stopp** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steuern**, um diese Folgeanfrage in den laufenden Durchlauf einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des normalen Ablaufs abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Abbruch-Teilen">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistententext weiterhin in der UI angezeigt werden.
    - Das Gateway speichert abgebrochenen teilweisen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptverbraucher Abbruch-Teile von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-State-Verzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzdaten. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Abonnement-Endpunkte.                         |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel fest pinnen möchten (für Multi-Host-Bereitstellungen, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `mailto:openclaw@localhost`)

Die Control UI verwendet diese scope-gebundenen Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestütztes Push) und von der vorhandenen Methode `push.test`, die auf native mobile Kopplung abzielt.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem `[embed ...]`-Shortcode rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung in gehosteten Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen, während die Origin-Isolation erhalten bleibt; dies ist der Standard und reicht normalerweise für eigenständige Browserspiele/-Widgets aus.
  </Tab>
  <Tab title="trusted">
    Fügt zusätzlich zu `allow-scripts` `allow-same-origin` für Dokumente derselben Website hinzu, die bewusst stärkere Berechtigungen benötigen.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten agentengenerierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Drittanbieterseiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chat-Nachrichtenbreite

Gruppierte Chat-Nachrichten verwenden eine gut lesbare standardmäßige maximale Breite. Bereitstellungen auf breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentwerte wie `960px` oder `82%` sowie eingeschränkte Breiten-Ausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Halten Sie das Gateway auf local loopback und lassen Sie Tailscale Serve es per HTTPS proxien:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können sich Control UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem die `x-forwarded-for`-Adresse mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage local loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control UI-Operatorsitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Geräte-Kopplungs-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Datenverkehr explizite Shared-Secret-Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungs-Scope serialisiert, bevor Rate-Limit-Schreibvorgänge erfolgen. Gleichzeitige fehlerhafte Wiederholungen desselben Browsers können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, verlangen Sie Token-/Passwort-Authentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Dann öffnen Sie:

    - `http://<tailscale-ip>:18789/` (oder Ihr konfigurierter `gateway.controlUi.basePath`)

    Fügen Sie das passende gemeinsame Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur für localhost bestimmte Kompatibilität mit unsicherem HTTP über `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Behebung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

<AccordionGroup>
  <Accordion title="Verhalten des Insecure-Auth-Schalters">
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

    - Er erlaubt localhost-Control-UI-Sitzungen in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte Verbindungen (nicht localhost).

  </Accordion>
  <Accordion title="Nur für Notfälle">
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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsverschlechterung. Machen Sie dies nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu trusted-proxy">
    - Erfolgreiche trusted-proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Same-Host-Loopback-Reverse-Proxys erfüllen trusted-proxy-Authentifizierung weiterhin nicht; siehe [Trusted proxy auth](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Policy ausgeliefert: Erlaubt sind nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal erzeugte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Das bedeutet in der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin gerendert.
- Von Channel-Metadaten ausgegebene Remote-Avatar-URLs werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten assistant-media-Route). Dadurch wird verhindert, dass die Avatar-Route auf ansonsten geschützten Hosts Agent-Identität preisgibt.
- Die Control UI selbst leitet das Gateway-Token beim Abrufen von Avataren als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild in Dashboards weiterhin gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem Rest des Gateway.

## Authentifizierung der assistant-media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet das Gateway-Token beim Prüfen der Verfügbarkeit als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Im Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt normales Medienrendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldeinformationen in sichtbare Medien-URLs einzubetten.

## UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs wünschen):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für die lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, das Gateway aber anderswo läuft.

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
    - Wenn Sie einen vollständigen `ws://`- oder `wss://`-Endpunkt über `gatewayUrl` übergeben, URL-codieren Sie den Wert `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrageprotokollen und im Referer vermieden werden. Legacy-`?token=`-Query-Parameter werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und direkt nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Anmeldeinformationen aus Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldeinformationen sind ein Fehler.
    - Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-Loopback-Control-UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Ursprünge). Dazu gehören Remote-Dev-Setups.
    - Der Gateway-Start kann lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port vorbefüllen, aber entfernte Browser-Ursprünge benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zu erlauben, nicht „den jeweils von mir verwendeten Host abgleichen“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Host-Header-Ursprungs-Fallbackmodus, ist aber ein gefährlicher Sicherheitsmodus.

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
