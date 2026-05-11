---
read_when:
    - Sie möchten das Gateway über einen Browser betreiben
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-05-11T20:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

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
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfenster des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Das Onboarding erzeugt beim ersten Verbindungsaufbau normalerweise ein Gateway-Token für Shared-Secret-Authentifizierung, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsgenehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): pairing required“

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Admin-Zugriff ändern, wird dies als Genehmigungsupgrade behandelt, nicht als stille erneute Verbindung. OpenClaw lässt die alte Genehmigung aktiv, blockiert die umfassendere erneute Verbindung und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und benötigt keine erneute Genehmigung, es sei denn, Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Kopplungsrundlauf für Control-UI-Operatorsitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine explizite Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID. Wenn Sie also den Browser wechseln oder Browserdaten löschen, ist eine erneute Kopplung erforderlich.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in geteilten Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird nicht mit anderen Geräten synchronisiert oder serverseitig dauerhaft gespeichert, abgesehen von den normalen Transkript-Metadaten zur Autorenschaft für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder der Wechsel des Browsers setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und werden nie über `config.patch` zurückgesendet. Das gemeinsam genutzte Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt ist durch dieselbe Gateway-Authentifizierung geschützt wie der Rest der HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Gateway-Zugriff-Karte, nicht unter Darstellung.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei künftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für denselben nicht englischen Locale-Satz erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationssite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thai (`th`) und Persisch (`fa`)-Dokumentation werden weiterhin im Veröffentlichungs-Repo erzeugt; sie erscheinen möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungsfenster behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importslot. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in Darstellung ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen schaltet das aktive Theme zurück auf Claw, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Chatverlaufsaktualisierungen fordern ein begrenztes aktuelles Fenster mit Textobergrenzen pro Nachricht an, damit große Sitzungen den Browser nicht zwingen, eine vollständige Transkript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmalig verwendbares Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt und `openclaw_agent_consult`-Provider-Toolaufrufe über `talk.client.toolCall` für Gateway-Richtlinien und das größere konfigurierte OpenClaw-Modell weiterleitet.
    - Streamen Sie Toolaufrufe und Live-Tool-Ausgabekarten im Chat (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Dreams">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Login und Konfiguration pro Kanal (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal-Probe-Aktualisierungen halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und Teilsnapshots werden markiert, wenn ein Probe oder Audit sein UI-Budget überschreitet.
    - Instanzen: Präsenzliste + Aktualisierung (`system-presence`).
    - Sitzungen: Listet standardmäßig konfigurierte Agent-Sitzungen auf, fällt von veralteten unkonfigurierten Agent-Sitzungsschlüsseln zurück und wendet sitzungsspezifische Modell-/Thinking-/Fast-/Verbose-/Trace-/Reasoning-Überschreibungen an (`sessions.list`, `sessions.patch`).
    - Dreams: Dreaming-Status, Aktivieren-/Deaktivieren-Schalter und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: Auflisten/Hinzufügen/Bearbeiten/Ausführen/Aktivieren/Deaktivieren + Ausführungsverlauf (`cron.*`).
    - Skills: Status, Aktivieren/Deaktivieren, Installation, API-Schlüssel-Aktualisierungen (`skills.*`).
    - Nodes: Liste + Caps (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists bearbeiten + Abfragerichtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Anwenden + mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung wecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) führen vorab eine aktive SecretRef-Auflösung für Referenzen in der eingereichten Konfigurationsnutzlast aus; nicht auflösbare aktive eingereichte Referenzen werden vor dem Schreiben abgelehnt.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passenden UI-Hinweisen, unmittelbaren Kindzusammenfassungen, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositions-Nodes sowie Plugin- und Kanalschemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher per Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Auf gespeicherten Stand zurücksetzen“ im Raw-JSON-Editor bewahrt die roh verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen einen Reset überstehen, wenn der Snapshot sicher per Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formulartexteingaben schreibgeschützt gerendert, um eine versehentliche Objekt-zu-String-Beschädigung zu verhindern.

  </Accordion>
  <Accordion title="Debug, Protokolle, Update">
    - Debug: Status-/Health-/Modell-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control-UI-Aktualisierungs-/RPC-Timings, langsame Chat-/Konfigurations-Render-Timings und Browser-Reaktionsfähigkeitseinträge für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Protokolle: Live-Tail der Gateway-Dateiprotokolle mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit einem Neustartbericht und anschließend nach der erneuten Verbindung `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Fenster">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf Keine umschalten, wenn Sie nur interne Ausführungen möchten.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Hauptsitzungsjobs sind Webhook- und Keine-Zustellmodi verfügbar.
    - Erweiterte Bearbeitungssteuerelemente enthalten Nach-Ausführung-löschen, Agent-Überschreibung löschen, Cron-Exact-/Stagger-Optionen, Agent-Modell-/Thinking-Überschreibungen und Best-Effort-Zustellungsschalter.
    - Die Formularvalidierung erfolgt inline mit feldbezogenen Fehlern; ungültige Werte deaktivieren die Schaltfläche Speichern, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es ausgelassen wird, wird der Webhook ohne Authentifizierungsheader gesendet.
    - Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert werden.

  </Accordion>
</AccordionGroup>

## Chatverhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, große Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Assistenten-/generierte Bilder werden als verwaltete Medienreferenzen gespeichert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Neuladevorgänge nicht davon abhängen, dass rohe Base64-Bildpayloads in der Chatverlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI nur zur Anzeige dienende Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-Tool-Call-XML-Payloads (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur das exakte Silent-Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendevorgangs und der finalen Verlaufsaktualisierung hält die Chatansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Final-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agentenlauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agentenfilter vor der Sitzungsauswahl, und die Sitzungsauswahl ist auf den ausgewählten Agenten beschränkt. Beim Wechseln von Agenten werden nur Sitzungen angezeigt, die mit diesem Agenten verbunden sind, und es wird auf die Hauptsitzung dieses Agenten zurückgegriffen, wenn noch keine gespeicherten Dashboard-Sitzungen vorhanden sind.
    - Auf Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; Hochscrollen, Zurückkehren zum Anfang oder Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Sprechblase mit Zähler-Badge gerendert. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht eingeklappt.
    - Die Modell- und Thinking-Auswahl im Chat-Header patcht die aktive Sitzung sofort über `sessions.patch`; es handelt sich um persistente Sitzungsüberschreibungen, nicht um nur für einen Turn geltende Sendeoptionen.
    - Wenn Sie eine Nachricht senden, während eine Änderung der Modellauswahl für dieselbe Sitzung noch gespeichert wird, wartet der Composer vor dem Aufruf von `chat.send` auf diesen Sitzungspatch, damit der Sendevorgang das ausgewählte Modell verwendet.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe neue Dashboard-Sitzung wie New Chat und wechselt dorthin, außer wenn `session.dmScope: "main"` konfiguriert ist und der aktuelle Parent die Hauptsitzung des Agenten ist; in diesem Fall wird die Hauptsitzung direkt zurückgesetzt. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl, einschließlich `provider/*`-Einträgen, die provider-spezifische Kataloge dynamisch halten. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte aktuelle Kontexttoken enthalten, zeigt der Chat-Composer-Bereich eine kompakte Kontextnutzungsanzeige. Sie wechselt bei hohem Kontextdruck zu einer Warnformatierung und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche an, die den normalen Sitzung-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway wieder frische Nutzung meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Voice-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus entweder `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` oder einem `openai-codex`-OAuth-Profil; konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält nie einen Standard-Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token festgeschrieben werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Anmeldedaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs läuft. Der Realtime-Sitzungsprompt wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Der Chat-Composer enthält neben der Start-/Stopp-Schaltfläche für Talk eine Schaltfläche für Talk-Optionen. Die Optionen gelten für die nächste Talk-Sitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Präfix-Padding überschreiben. Wenn eine Option leer ist, verwendet der Gateway konfigurierte Standardwerte, sofern verfügbar, oder den Provider-Standard. Die Auswahl des Gateway-Relays erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung clientseitig und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browsersitzung erstellen kann.

    Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, anschließend `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Call das konfigurierte größere Modell über `talk.client.toolCall` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung von Google Live mit eingeschränktem Token für Browser-WebSocket und den Gateway-Relay-Browser-Adapter mit gefälschtem Mikrofonmedium. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgefragen in die Warteschlange gestellt. Klicken Sie bei einer eingereihten Nachricht auf **Steer**, um diese Folgefrage in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchformulierungen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Aufbewahrung abgebrochener Teilausgaben">
    - Wenn ein Lauf abgebrochen wird, kann teilweise Assistententext dennoch in der UI angezeigt werden.
    - Der Gateway persistiert abgebrochenen teilweisen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten abgebrochene Teilausgaben von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA auch dann mit Benachrichtigungen zu wecken, wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-State-Verzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel fest pinnen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `mailto:openclaw@localhost`)

Die Control UI verwendet diese scope-geschützten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützte Push-Benachrichtigungen) und der bestehenden Methode `push.test`, die auf natives mobiles Pairing zielen.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem `[embed ...]`-Shortcode rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (default)">
    Erlaubt interaktive Einbettungen bei gleichzeitiger Origin-Isolation; dies ist der Standard und reicht in der Regel für eigenständige Browser-Spiele/-Widgets aus.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten agentengenerierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie absichtlich möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chatnachrichten

Gruppierte Chatnachrichten verwenden eine lesbare Standard-Maximalbreite. Wide-Monitor-Deployments können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentangaben wie `960px` oder `82%` sowie eingeschränkte Breiten-Ausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Belassen Sie den Gateway auf local loopback und lassen Sie Tailscale Serve ihn mit HTTPS proxyn:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können Control-UI/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw verifiziert die Identität, indem es die `x-forwarded-for`-Adresse mit `tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die Anfrage loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control-UI-Bedienersitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Device-Pairing-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungsbereich vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungsversuche aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code laufen kann, verlangen Sie Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet + Token binden">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP (`http://<lan-ip>` oder `http://<tailscale-ip>`) öffnen, läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- localhost-only-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Bediener-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

<AccordionGroup>
  <Accordion title="Verhalten des Schalters für unsichere Authentifizierung">
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

    - Er erlaubt localhost-Control-UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht-localhost) Verbindungen.

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
    `dangerouslyDisableDeviceAuth` deaktiviert Control-UI-Prüfungen der Geräteidentität und ist eine schwerwiegende Sicherheitsabsenkung. Machen Sie die Änderung nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu Trusted Proxy">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Bediener**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Same-Host-loopback-Reverse-Proxys erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal erzeugte `blob:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgewiesen und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Kanalmetadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keinen beliebigen entfernten Bildabruf aus einem Bedienerbrowser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgewiesen (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI leitet beim Abrufen von Avataren selbst das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem Rest des Gateway.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistant eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Control-UI-Bedienerauthentifizierung. Der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` statt des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt normales Medien-Rendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbare Medien-URLs zu setzen.

## UI bauen

Der Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Entwicklungsserver):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Leere Control-UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen nützlichen Fehler zeigt, hat möglicherweise eine Erweiterung oder ein frühes Content-Script verhindert, dass die JavaScript-Modul-App ausgewertet wird. Die statische Seite enthält ein einfaches HTML-Wiederherstellungspanel, das erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie nach Änderung der Browserumgebung die Aktion **Erneut versuchen** im Panel, oder laden Sie nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die in alle Seiten injizieren, insbesondere Erweiterungen mit `<all_urls>`-Content-Scripts.
- Testen Sie ein privates Fenster, ein sauberes Browserprofil oder einen anderen Browser.
- Lassen Sie den Gateway laufen und prüfen Sie nach der Browseränderung dieselbe Dashboard-URL.

## Debugging/Tests: Entwicklungsserver + entfernter Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Entwicklungsserver lokal verwenden möchten, der Gateway aber woanders läuft.

<Steps>
  <Step title="UI-Entwicklungsserver starten">
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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-kodieren Sie den Wert `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte, wann immer möglich, über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrageprotokollen und Referern vermieden werden. Legacy-`?token=`-Query-Parameter werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Speicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungsanmeldedaten zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn der Gateway hinter TLS steht (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-loopback-Control-UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Ursprünge). Dies schließt entfernte Entwicklungsumgebungen ein.
    - Der Gateway-Start kann lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port übernehmen, entfernte Browser-Ursprünge benötigen jedoch weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zu erlauben, nicht „den Host abgleichen, den ich gerade verwende“.
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

Details zur Einrichtung des entfernten Zugriffs: [Entfernter Zugriff](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chatoberfläche
