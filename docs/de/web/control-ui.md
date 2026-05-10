---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Knoten, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-05-10T19:57:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit** Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionaler Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Auth wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungspanel des Dashboards behält ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht gespeichert. Das Onboarding erzeugt normalerweise beim ersten Verbinden ein Gateway-Token für Shared-Secret-Auth, aber Passwort-Auth funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsgenehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Ausstehende Anfragen auflisten">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Nach Anfragen-ID genehmigen">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Wenn der Browser die Kopplung mit geänderten Auth-Details erneut versucht (Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff ändern, wird dies als Genehmigungsupgrade behandelt, nicht als stille Wiederverbindung. OpenClaw lässt die alte Genehmigung aktiv, blockiert die umfassendere Wiederverbindung und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn, Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann die Kopplungsrunde für Control UI-Bedienersitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität präsentiert.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID; ein Browserwechsel oder das Löschen von Browserdaten erfordert daher eine erneute Kopplung.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine browserbezogene persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in geteilten Sitzungen angehängt wird. Sie befindet sich im Browser-Speicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normalen Transkript-Autorenschaftsmetadaten der tatsächlich von Ihnen gesendeten Nachrichten hinaus gespeichert. Durch das Löschen von Websitedaten oder einen Browserwechsel wird sie geleert.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und durchlaufen nie `config.patch`. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt weiterhin für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Runtime-Einstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt wird durch dieselbe Gateway-Auth geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Gateway-Zugriff-Karte, nicht unter Darstellung.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht-englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Docs-Übersetzungen werden für denselben nicht-englischen Locale-Satz erzeugt, aber die integrierte Mintlify-Sprachauswahl der Docs-Website ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Docs werden weiterhin im Publish-Repo erzeugt; sie erscheinen möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungspanel behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importslot. Um ein Theme zu importieren, öffnen Sie den [tweakcn editor](https://tweakcn.com/editor/theme), wählen oder erstellen ein Theme, klicken auf **Teilen** und fügen den kopierten Theme-Link in Darstellung ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen schaltet das aktive Theme wieder auf Claw zurück, falls das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Chatverlauf-Aktualisierungen fordern ein begrenztes aktuelles Fenster mit Textlimits pro Nachricht an, sodass große Sitzungen den Browser nicht zwingen, eine vollständige Transkript-Payload zu rendern, bevor der Chat nutzbar wird.
    - Über Browser-Echtzeitsitzungen sprechen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Einmal-Browser-Token über WebSocket, und rein backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay behält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt und `openclaw_agent_consult`-Provider-Toolaufrufe über `talk.client.toolCall` für Gateway-Richtlinie und das größere konfigurierte OpenClaw-Modell weiterleitet.
    - Toolaufrufe + Live-Tool-Ausgabekarten im Chat streamen (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Login und kanalspezifische Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal-Probe-Aktualisierungen halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und partielle Snapshots werden gekennzeichnet, wenn eine Probe oder ein Audit ihr UI-Budget überschreitet.
    - Instanzen: Anwesenheitsliste + Aktualisierung (`system-presence`).
    - Sitzungen: standardmäßig konfigurierte Agent-Sitzungen auflisten, von veralteten unkonfigurierten Agent-Sitzungsschlüsseln zurückfallen und Modell-/Thinking-/Fast-/Verbose-/Trace-/Reasoning-Überschreibungen pro Sitzung anwenden (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Aktivieren/Deaktivieren-Schalter und Dream Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: Liste + Caps (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists + Ask-Richtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Mit Validierung anwenden + neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen die aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurations-Payload vorab; nicht aufgelöste aktive übermittelte Refs werden vor dem Schreiben abgelehnt.
    - Schema + Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passenden UI-Hinweisen, direkten Kindzusammenfassungen, Docs-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositions-Nodes sowie Plugin- + Kanal-Schemas, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher roundtrippen kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - "Auf Gespeichertes zurücksetzen" im Raw-JSON-Editor erhält die roh verfasste Struktur (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher roundtrippen kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um versehentliche Objekt-zu-String-Beschädigungen zu verhindern.

  </Accordion>
  <Accordion title="Debug, Logs, Update">
    - Debug: Status-/Health-/Modell-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control UI-Aktualisierungs-/RPC-Timings, langsame Chat-/Konfigurations-Render-Timings und Browser-Reaktionsfähigkeitseinträge für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update + Neustart ausführen (`update.run`) mit Neustartbericht, danach `update.status` nach der Wiederverbindung abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Panel">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf keine umschalten, wenn Sie nur interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Jobs in der Hauptsitzung sind die Zustellmodi Webhook und keine verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Nach-Ausführung-löschen, Agent-Überschreibung löschen, Cron-Exact-/Stagger-Optionen, Agent-Modell-/Thinking-Überschreibungen und Best-Effort-Zustellungsschalter.
    - Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert wurden.

  </Accordion>
</AccordionGroup>

## Chatverhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - Chat-Uploads akzeptieren Bilder plus Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Vom Assistant erzeugte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgeliefert, sodass Neuladungen nicht davon abhängen, dass rohe base64-Bildnutzlasten in der Chat-Verlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI reine Anzeige-Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Nutzlasten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modell-Steuertokens und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur das exakte Silent-Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistant-Nachrichten sichtbar, falls `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Abschlussereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistant-Notiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agentenfilter vor der Sitzungsauswahl, und die Sitzungsauswahl ist auf den ausgewählten Agenten beschränkt. Beim Wechseln von Agenten werden nur Sitzungen angezeigt, die mit diesem Agenten verknüpft sind; falls noch keine gespeicherten Dashboard-Sitzungen vorhanden sind, wird auf die Hauptsitzung dieses Agenten zurückgegriffen.
    - Auf Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; Heraufscrollen, Zurückkehren zum Anfang oder Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte Nur-Text-Nachrichten werden als eine Sprechblase mit Zählabzeichen gerendert. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen werden nicht zusammengeklappt.
    - Die Modell- und Thinking-Auswahlelemente im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine nur für einen Turn geltenden Sendeoptionen.
    - Wenn Sie eine Nachricht senden, während eine Änderung im Modellauswahlelement für dieselbe Sitzung noch gespeichert wird, wartet der Composer auf diesen Sitzungspatch, bevor er `chat.send` aufruft, damit der Sendevorgang das ausgewählte Modell verwendet.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe neue Dashboard-Sitzung wie Neuer Chat und wechselt dorthin, außer wenn `session.dmScope: "main"` konfiguriert ist und der aktuelle Parent die Hauptsitzung des Agenten ist; in diesem Fall wird die Hauptsitzung an Ort und Stelle zurückgesetzt. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Das Chat-Modellauswahlelement fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist das Auswahlelement, einschließlich `provider/*`-Einträgen, die Provider-bezogene Kataloge dynamisch halten. Andernfalls zeigt das Auswahlelement explizite `models.providers.*.models`-Einträge plus Provider mit nutzbarer Authentifizierung an. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn aktuelle Gateway-Sitzungsnutzungsberichte aktuelle Kontexttokens enthalten, zeigt der Chat-Composer-Bereich eine kompakte Kontextnutzungsanzeige. Bei hohem Kontextdruck wechselt sie zu Warnstil und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche an, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway wieder aktuelle Nutzung meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus entweder `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` oder einem `openai-codex`-OAuth-Profil; konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen Standard-Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch den Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Anbieter-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs läuft. Der Prompt der Realtime-Sitzung wird vom Gateway zusammengesetzt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Der Chat-Composer enthält neben der Start-/Stopp-Schaltfläche für Talk eine Schaltfläche für Talk-Optionen. Die Optionen gelten für die nächste Talk-Sitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Präfix-Padding überschreiben. Wenn eine Option leer ist, verwendet der Gateway verfügbare konfigurierte Standardwerte oder den Provider-Standard. Die Auswahl von Gateway-Relay erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung clientseitig und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browser-Sitzung erstellen kann.

    Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, danach `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `talk.client.toolCall` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung des eingeschränkten Google Live-Token-Browser-WebSockets und den Gateway-Relay-Browser-Adapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stoppen** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer Nachricht in der Warteschlange auf **Steuern**, um diese Folgeanfrage in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des normalen Ablaufs abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Abbruchteilergebnissen">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden.
    - Der Gateway persistiert abgebrochenen teilweisen Assistant-Text im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten Abbruchteilergebnisse von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web-Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-State-Verzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzlasten. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Abonnement-Endpunkte.                         |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel festpinnen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `mailto:openclaw@localhost`)

Die Control UI verwendet diese bereichsbeschränkten Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relaygestütztes Push) und der bestehenden Methode `push.test`, die auf native mobile Kopplung abzielt.
</Note>

## Gehostete Einbettungen

Assistant-Nachrichten können gehostete Webinhalte inline mit dem `[embed ...]`-Shortcode rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen bei beibehaltener Ursprungsisolation; dies ist der Standard und reicht normalerweise für eigenständige Browserspiele/-Widgets aus.
  </Tab>
  <Tab title="trusted">
    Fügt `allow-same-origin` zusätzlich zu `allow-scripts` für Dokumente derselben Site hinzu, die absichtlich stärkere Berechtigungen benötigen.
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

## Chat-Nachrichtenbreite

Gruppierte Chat-Nachrichten verwenden eine lesbare Standard-Maximalbreite. Deployments mit breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

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
    Belassen Sie den Gateway auf local loopback und lassen Sie Tailscale Serve ihn per HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfigurierter `gateway.controlUi.basePath`)

    Standardmäßig können Control UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw verifiziert die Identität, indem die `x-forwarded-for`-Adresse mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Bei Control UI-Operatorsitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad auch den Geräte-Pairing-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Traffic explizite Shared-Secret-Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungs-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungsversuche aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, anstatt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, verlangen Sie Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="An tailnet + Token binden">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP (`http://<lan-ip>` oder `http://<tailscale-ip>`) öffnen, läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- nur localhost betreffende unsichere HTTP-Kompatibilität mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

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

    `allowInsecureAuth` ist ausschließlich ein lokaler Kompatibilitätsschalter:

    - Er erlaubt localhost-Control UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Geräteidentitätsanforderungen für entfernte Verbindungen (nicht localhost).

  </Accordion>
  <Accordion title="Nur für Break-Glass">
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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine schwerwiegende Sicherheitsabsenkung. Machen Sie dies nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu Trusted Proxy">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control UI-Sitzungen mit Node-Rolle.
    - Same-Host-loopback-Reverse-Proxys erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strengen `img-src`-Policy ausgeliefert: Nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal erzeugte `blob:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Das bedeutet in der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Channel-Metadaten ausgegeben werden, werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Avatar-Routen-Authentifizierung

Wenn Gateway-Authentifizierung konfiguriert ist, verlangt der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route die Agent-Identität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route entsprechend dem Rest des Gateways nicht authentifiziert.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Control UI-Operatorauthentifizierung. Der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Im Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Dadurch bleibt normales Medienrendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbare Medien-URLs zu legen.

## UI bauen

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
    - Wenn Sie einen vollständigen `ws://`- oder `wss://`-Endpunkt über `gatewayUrl` übergeben, URL-kodieren Sie den Wert `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrageprotokollen und Referer vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Speicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-loopback-Control UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Ursprünge). Dazu gehören entfernte Dev-Setups.
    - Beim Start kann das Gateway lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und -Port vorbelegen, aber entfernte Browser-Ursprünge benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für eng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zu erlauben, nicht „jeden Host abzugleichen, den ich verwende“.
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

Details zur Einrichtung des entfernten Zugriffs: [Remote-Zugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Zustandsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
