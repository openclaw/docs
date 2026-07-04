---
read_when:
    - Sie möchten den Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Aktivität, Knoten, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-07-04T17:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`)

Sie spricht **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

<Note>
Bei nativen Windows-LAN-Bindungen können die Windows-Firewall oder per Organisation verwaltete Gruppenrichtlinien die angegebene LAN-URL weiterhin blockieren, selbst wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, Profilabweichungen und lokale Firewall-Regeln, die von Richtlinien möglicherweise ignoriert werden.
</Note>

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungen-Panel des Dashboards behält ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Das Onboarding erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für die Authentifizierung per gemeinsamem Geheimnis, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie von einem neuen Browser oder Gerät aus eine Verbindung zur Control UI herstellen, verlangt das Gateway normalerweise eine **einmalige Kopplungsfreigabe**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Berechtigungsumfänge/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff umstellen, wird dies als Genehmigungs-Upgrade behandelt, nicht als stille Wiederverbindung. OpenClaw hält die alte Genehmigung aktiv, blockiert die breitere Wiederverbindung und fordert Sie auf, den neuen Umfangssatz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und benötigt keine erneute Genehmigung, es sei denn, Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

Paperclip-Agenten, die sich über den `openclaw_gateway`-Adapter verbinden, verwenden denselben Freigabefluss beim ersten Start. Führen Sie nach dem ersten Verbindungsversuch `openclaw devices approve --latest` aus, um die ausstehende Anfrage in der Vorschau anzuzeigen, und führen Sie anschließend den ausgegebenen Befehl `openclaw devices approve <requestId>` erneut aus, um sie zu genehmigen. Übergeben Sie für ein entferntes Gateway explizite Werte für `--url` und `--token`. Um Genehmigungen über Neustarts hinweg stabil zu halten, konfigurieren Sie in Paperclip ein dauerhaftes `adapterConfig.devicePrivateKeyPem`, statt bei jedem Lauf eine neue flüchtige Geräteidentität erzeugen zu lassen.

<Note>
- Direkte Browserverbindungen über local loopback (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann die Kopplungsrunde für Control-UI-Bediensitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gilt, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID; ein Browserwechsel oder das Löschen von Browserdaten erfordert daher eine erneute Kopplung.

</Note>

## Ein Mobilgerät koppeln

Ein bereits gekoppelter Administrator kann den iOS-/Android-Verbindungs-QR-Code erstellen, ohne
ein Terminal zu öffnen:

<Steps>
  <Step title="Mobile Kopplung öffnen">
    Wählen Sie **Nodes** aus und klicken Sie dann in der Karte **Devices** auf **Pair mobile device**.
  </Step>
  <Step title="Telefon verbinden">
    Öffnen Sie in der mobilen OpenClaw-App **Settings** → **Gateway** und scannen Sie den QR-
    Code. Alternativ können Sie den Einrichtungscode kopieren und einfügen.
  </Step>
  <Step title="Verbindung bestätigen">
    Die offizielle iOS-/Android-App verbindet sich automatisch. Wenn **Devices** eine
    ausstehende Anfrage anzeigt, prüfen Sie deren Rolle und Berechtigungsumfänge, bevor Sie sie genehmigen.
  </Step>
</Steps>

Das Erstellen eines Einrichtungscodes erfordert `operator.admin`; die Schaltfläche ist für
Sitzungen ohne diese Berechtigung deaktiviert. Ein Einrichtungscode enthält kurzlebige Bootstrap-Anmeldedaten,
behandeln Sie den QR-Code und den kopierten Code daher wie ein Passwort, solange sie gültig sind. Für eine entfernte
Kopplung muss das Gateway zu `wss://` auflösen (zum Beispiel über Tailscale
Serve/Funnel); einfaches `ws://` ist auf loopback- und private LAN-Adressen beschränkt.
Siehe [Kopplung](/de/channels/pairing#pair-from-the-control-ui-recommended) für die
vollständigen Sicherheits- und Fallback-Details.

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsamen Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil begrenzt und wird weder mit anderen Geräten synchronisiert noch serverseitig dauerhaft gespeichert, abgesehen von den normalen Urheberschaftsmetadaten im Transkript für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und laufen nie über `config.patch` zurück. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder eigene Dashboards).

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Runtime-Einstellungen von `/control-ui-config.json` ab, aufgelöst relativ zum Control-UI-Basispfad des Gateways (zum Beispiel `/__openclaw__/control-ui-config.json`, wenn die UI unter `/__openclaw__/` bereitgestellt wird). Dieser Endpunkt ist durch dieselbe Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um sie später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Die Locale-Auswahl befindet sich in der Karte „Gateway Access“, nicht unter „Appearance“.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Docs-Übersetzungen werden für denselben nicht englischen Locale-Satz erzeugt, aber die eingebaute Mintlify-Sprachauswahl der Docs-Website ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thai (`th`) und Persisch (`fa`) werden weiterhin im Veröffentlichungs-Repo erzeugt; sie erscheinen möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Erscheinungsbild-Themes

Das Appearance-Panel behält die eingebauten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Import-Slot. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Share** und fügen Sie den kopierten Theme-Link in Appearance ein. Der Importer akzeptiert außerdem Registry-URLs wie `https://tweakcn.com/r/themes/<id>`, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade wie `/themes/<id>`, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Appearance enthält außerdem eine browserlokale Einstellung für die Textgröße. Die Einstellung wird zusammen mit den übrigen Control-UI-Einstellungen gespeichert, gilt für Chat-Text, Composer-Text, Tool-Karten und Chat-Seitenleisten und hält Texteingaben bei mindestens 16px, damit Mobile Safari beim Fokus nicht automatisch zoomt.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen schaltet das aktive Theme zurück auf Claw, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Sprechen">
    - Chatten Sie mit dem Modell über Gateway-WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Aktualisierungen des Chatverlaufs fordern ein begrenztes aktuelles Fenster mit Textobergrenzen pro Nachricht an, damit große Sitzungen den Browser nicht zwingen, eine vollständige Transkript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmalig nutzbares Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen beginnen mit `talk.client.create`; Gateway-Relay-Sitzungen beginnen mit `talk.session.create`. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, `openclaw_agent_consult`-Provider-Tool-Aufrufe über `talk.client.toolCall` für Gateway-Richtlinien und das größere konfigurierte OpenClaw-Modell weiterleitet und Sprachsteuerung für aktive Läufe über `talk.client.steer` oder `talk.session.steer` routet.
    - Streamen Sie Tool-Aufrufe und Live-Tool-Ausgabekarten im Chat (Agent-Ereignisse).
    - Aktivitäts-Tab mit browserlokalen, redaktionsorientierten Zusammenfassungen der Live-Tool-Aktivität aus bestehender `session.tool`- / Tool-Ereignisbereitstellung.

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: Status von eingebauten sowie gebündelten/externen Plugin-Kanälen, QR-Anmeldung und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal-Probe-Aktualisierungen halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und Teilsnapshots werden gekennzeichnet, wenn eine Probe oder ein Audit ihr UI-Budget überschreitet.
    - Instanzen: Anwesenheitsliste und Aktualisierung (`system-presence`).
    - Sitzungen: Standardmäßig Sitzungen konfigurierter Agenten auflisten, von veralteten Sitzungsschlüsseln nicht konfigurierter Agenten zurückfallen und modell-/thinking-/fast-/verbose-/trace-/reasoning-Überschreibungen pro Sitzung anwenden (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Aktivieren-/Deaktivieren-Schalter und Traumtagebuch-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: auflisten und Fähigkeiten (`node.list`), mobile Einrichtungscodes erstellen und Gerätekopplung genehmigen (`device.pair.*`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists bearbeiten und Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - MCP hat eine eigene Einstellungsseite für konfigurierte Server, Aktivierung, OAuth-/Filter-/Parallel-Zusammenfassungen, gängige Operatorbefehle und den bereichsbezogenen `mcp`-Konfigurationseditor.
    - Anwenden + mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurationsnutzlast; nicht aufgelöste aktive übermittelte Refs werden vor dem Schreiben abgelehnt.
    - Formularspeicherungen verwerfen veraltete redigierte Platzhalter, die nicht aus der gespeicherten Konfiguration wiederhergestellt werden können, während redigierte Werte erhalten bleiben, die weiterhin gespeicherten Secrets zugeordnet sind.
    - Schema- + Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passenden UI-Hinweisen, Zusammenfassungen unmittelbarer untergeordneter Elemente, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- + Kanalschemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher im Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - Der Raw-JSON-Editor „Auf gespeicherten Stand zurücksetzen“ bewahrt die raw-verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen ein Zurücksetzen überstehen, wenn der Snapshot einen sicheren Roundtrip ausführen kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um eine versehentliche Beschädigung von Objekt zu String zu verhindern.

  </Accordion>
  <Accordion title="Debugging, Logs, Update">
    - Debugging: Status-/Health-/Modell-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Aktualisierungs-/RPC-Zeitmessungen der Control UI, Zeitmessungen für langsames Chat-/Konfigurations-Rendering und Einträge zur Browser-Reaktionsfähigkeit für lange Animationsframes oder lange Aufgaben, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Datei-Logs mit Filter/Export (`logs.tail`).
    - Update: ein Paket-/Git-Update + Neustart (`update.run`) mit einem Neustartbericht ausführen, dann nach dem erneuten Verbinden `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Panel">
    - Bei isolierten Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen eingestellt. Sie können auf keine umstellen, wenn Sie nur interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Hauptsitzungs-Jobs sind die Zustellmodi Webhook und keine verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Nach-Ausführung-löschen, Agent-Override entfernen, Cron-Optionen für exakt/gestaffelt, Agent-Modell-/Thinking-Overrides und Best-Effort-Zustellungs-Umschalter.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speicherschaltfläche, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es ausgelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Legacy-Jobs mit `notify: true` von `cron.webhook` zu expliziter Webhook- oder Abschlusszustellung pro Job zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operatoransicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet MCP-Transporte nicht selbst; verwenden Sie sie, um gespeicherte Konfiguration zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie einen Live-Server-Nachweis benötigen.

Typischer Workflow:

1. Öffnen Sie **MCP** über die Seitenleiste.
2. Prüfen Sie die Zusammenfassungskarten auf Gesamtzahl sowie Anzahl aktivierter, OAuth- und gefilterter Server.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierung, Authentifizierung, Filter, Timeouts und Befehlshinweise.
4. Schalten Sie die Aktivierung um, wenn ein Server konfiguriert bleiben, aber von der Laufzeit-Erkennung ausgeschlossen werden soll.
5. Bearbeiten Sie den bereichsbezogenen `mcp`-Konfigurationsabschnitt für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Tool-Filter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern & veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, wenn der bearbeitete Prozess statische Diagnosen, Live-Nachweise oder die Entsorgung gecachter Laufzeiten benötigt.

Die Seite redigiert zugangsdatenhaltige URL-ähnliche Werte vor dem Rendern und setzt Servernamen in Befehlssnippets in Anführungszeichen, sodass kopierte Befehle auch mit Leerzeichen oder Shell-Metazeichen funktionieren. Die vollständige CLI- und Konfigurationsreferenz finden Sie unter [MCP](/de/cli/mcp).

## Aktivität-Tab

Der Aktivität-Tab ist ein flüchtiger browserlokaler Beobachter für Live-Tool-Aktivität. Er wird aus demselben Gateway-`session.tool`-/Tool-Ereignisstream abgeleitet, der die Chat-Tool-Karten betreibt; er fügt keine weitere Gateway-Ereignisfamilie, keinen Endpunkt, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachterstream hinzu.

Aktivitätseinträge speichern nur bereinigte Zusammenfassungen und redigierte, gekürzte Ausgabevorschauen. Tool-Argumentwerte werden nicht im Aktivitätszustand gespeichert; die UI zeigt, dass Argumente ausgeblendet sind, und zeichnet nur die Anzahl der Argumentfelder auf. Die In-Memory-Liste folgt dem aktuellen Browser-Tab, übersteht die Navigation innerhalb der Control UI und wird bei Seitenneuladen, Sitzungswechsel oder **Löschen** zurückgesetzt.

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Zeitmetadaten für lokale Diagnosen erhalten.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind aus UI-Sicherheitsgründen größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann Gateway lange Textfelder kürzen, schwere Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann der Seitenleser den vollständigen anzeige-normalisierten Transkripteintrag bei Bedarf über `chat.message.get` per `sessionKey`, aktivem `agentId` bei Bedarf und Transkript-`messageId` abrufen. Wenn Gateway dennoch nicht mehr zurückgeben kann, zeigt der Leser einen ausdrücklichen Nicht-verfügbar-Zustand, statt die gekürzte Vorschau stillschweigend zu wiederholen.
    - Assistenten-/generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgeliefert, sodass Neuladevorgänge nicht davon abhängen, dass rohe base64-Bildnutzlasten in der Chat-Verlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI rein anzeigebezogene Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-Tool-Call-XML-Nutzlasten (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Fullwidth-Modellsteuerungstoken und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind Zustellzustand, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-final-Ereignissen lädt die Control UI den Verlauf neu und führt nur ein kleines optimistisches Ende zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agent-Run, keine Kanalzustellung).
    - Die Seitenleiste listet aktuelle Sitzungen mit einer Aktion Neue Sitzung, einem Link Alle Sitzungen und einer Sitzungssuchschaltfläche auf, die den vollständigen Sitzungsauswähler öffnet (bereichsbezogen nach dem ausgewählten Agent, mit Suche und Paginierung). Beim Wechseln des Agent werden nur Sitzungen angezeigt, die mit diesem Agent verknüpft sind; falls noch keine gespeicherten Dashboard-Sitzungen vorhanden sind, wird auf die Hauptsitzung dieses Agent zurückgegriffen.
    - Bei Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und klappen beim Herunterscrollen im Transkript ein; Hochscrollen, Zurückkehren zum Anfang oder Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Sprechblase mit Zähl-Badge gerendert. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht zusammengeklappt.
    - Die Modell- und Thinking-Auswähler im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungs-Overrides, keine Nur-ein-Turn-Sendeoptionen.
    - Wenn Sie eine Nachricht senden, während eine Modell-Auswähleränderung für dieselbe Sitzung noch gespeichert wird, wartet der Composer auf diesen Sitzungs-Patch, bevor `chat.send` aufgerufen wird, sodass der Sendevorgang das ausgewählte Modell verwendet.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe frische Dashboard-Sitzung wie Neuer Chat und wechselt zu ihr, außer wenn `session.dmScope: "main"` konfiguriert ist und der aktuelle Parent die Hauptsitzung des Agent ist; in diesem Fall wird die Hauptsitzung an Ort und Stelle zurückgesetzt. Die Eingabe von `/reset` behält das ausdrückliche In-Place-Zurücksetzen des Gateway für die aktuelle Sitzung bei.
    - Der Chat-Modellauswähler fordert die konfigurierte Modellansicht des Gateway an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist den Auswähler, einschließlich `provider/*`-Einträgen, die Provider-bereichsbezogene Kataloge dynamisch halten. Andernfalls zeigt der Auswähler explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte aktuelle Kontexttoken enthalten, zeigt die Chat-Composer-Symbolleiste einen kleinen Kontextnutzungsring mit dem genutzten Prozentsatz; die vollständigen Tokendetails befinden sich in seinem Tooltip. Der Ring wechselt bei hohem Kontextdruck zu Warn-Styling und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzung-Compaction-Pfad ausführt. Veraltete Token-Snapshots bleiben ausgeblendet, bis Gateway erneut frische Nutzungsdaten meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Realtime)">
    Der Sprechmodus verwendet einen registrierten Realtime-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus einem `openai`-API-Key-Auth-Profil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`; OpenAI-OAuth-Profile konfigurieren keine Realtime-Sprache. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen standardmäßigen Provider-API-Key. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch Gateway im Token gesperrt werden. Provider, die nur eine Backend-Realtime-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Anbieter-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungsprompt wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Instruction-Overrides.

    Der Chat-Composer enthält eine Schaltfläche für Talk-Optionen neben der Schaltfläche zum Starten/Stoppen von Talk. Die Optionen gelten für die nächste Talk-Sitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Prefix-Padding überschreiben. Wenn eine Option leer ist, verwendet das Gateway konfigurierte Standardwerte, soweit verfügbar, oder den Provider-Standard. Die Auswahl von Gateway-Relay erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung im Besitz des Clients und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browser-Sitzung erstellen kann.

    Im Chat-Composer ist die Talk-Steuerung die Wellen-Schaltfläche neben der Schaltfläche für Mikrofon-Diktat. Wenn Talk startet, zeigt die Statuszeile des Composers `Connecting Talk...`, danach `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf über `talk.client.toolCall` das konfigurierte größere Modell konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Browser-WebSocket-Einrichtung mit eingeschränkten Tokens und den Gateway-Relay-Browser-Adapter mit gefälschtem Mikrofonmedium. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steer**, um diese Folgeanfrage in den laufenden Turn einzuschleusen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (kein `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden.
    - Das Gateway persistiert abgebrochenen teilweisen Assistant-Text in der Transkript-Historie, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkript-Consumer Abbruch-Teilausgaben von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, selbst wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einem OpenClaw-Update **Protocol mismatch** anzeigt, öffnen Sie zuerst das Dashboard erneut mit `openclaw dashboard` und laden Sie die Seite mit Hard-Refresh neu. Wenn es weiterhin fehlschlägt, löschen Sie die Site-Daten für den Dashboard-Origin oder testen Sie in einem privaten Browserfenster; ein alter Tab oder Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle von vor dem Update gegen das neuere Gateway ausführen.

| Oberfläche                                            | Zweck                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „Install app“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-State-Verzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel festpinnen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `https://openclaw.ai`)

Die Control UI verwendet diese scope-gebundenen Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für Relay-gestütztes Push) und von der bestehenden Methode `push.test`, die auf natives Mobile-Pairing abzielt.
</Note>

## Gehostete Embeds

Assistant-Nachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die iframe-Sandbox-Policy wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung in gehosteten Embeds.
  </Tab>
  <Tab title="scripts (default)">
    Erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist der Standard und reicht in der Regel für eigenständige Browser-Spiele/-Widgets aus.
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

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie absichtlich möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chat-Nachrichten

Gruppierte Chat-Nachrichten verwenden eine lesbare Standard-Maximalbreite. Wide-Monitor-Deployments können sie ohne Patchen des gebündelten CSS überschreiben, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentwerte wie `960px` oder `82%` sowie eingeschränkte `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- und `fit-content(...)`-Breitenausdrücke.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Lassen Sie das Gateway auf local loopback und lassen Sie Tailscale Serve es mit HTTPS proxyn:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem es die Adresse `x-forwarded-for` mit `tailscale whois` auflöst und sie mit dem Header abgleicht, und akzeptiert diese nur, wenn die Anfrage local loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control-UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Roundtrip für Geräte-Pairing; Browser ohne Gerät und Node-Role-Verbindungen folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host laufen kann, verlangen Sie Token-/Passwortauthentifizierung.
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

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur-localhost-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
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

    - Er erlaubt localhost-Control-UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht-localhost) Verbindungen.

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsabstufung. Machen Sie dies nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies erstreckt sich **nicht** auf Node-Role-Control-UI-Sitzungen.
    - Same-Host-local loopback-Reverse-Proxys erfüllen weiterhin keine Trusted-Proxy-Authentifizierung; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Policy ausgeliefert: Nur Assets mit **same-origin**, `data:`-URLs und lokal generierte `blob:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das praktisch bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protokoll-Payloads).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Channel-Metadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI denselben Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dies verhindert, dass die Avatar-Route Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet den Gateway-Token beim Abrufen von Avataren als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem restlichen Gateway.

## Authentifizierung der Assistenten-Medienroute

Wenn die Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet das Gateway-Token beim Prüfen der Verfügbarkeit als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Im Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt normales Medienrendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbaren Medien-URLs offenzulegen.

## UI erstellen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

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

Richten Sie die UI anschließend auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Leere Control-UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen hilfreichen Fehler anzeigt, hat möglicherweise eine Erweiterung oder ein frühes Content Script verhindert, dass die JavaScript-Modul-App ausgewertet wird. Die statische Seite enthält ein schlichtes HTML-Wiederherstellungspanel, das erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie die Aktion **Erneut versuchen** des Panels, nachdem Sie die Browserumgebung geändert haben, oder laden Sie nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die in alle Seiten injizieren, insbesondere Erweiterungen mit `<all_urls>`-Content-Scripts.
- Versuchen Sie ein privates Fenster, ein sauberes Browserprofil oder einen anderen Browser.
- Lassen Sie das Gateway laufen und prüfen Sie dieselbe Dashboard-URL nach der Browseränderung erneut.

## Debugging/Testen: Dev-Server + entferntes Gateway

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-kodieren Sie den Wert von `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und im Referer vermieden werden. Legacy-Query-Parameter `?token=` werden zur Kompatibilität weiterhin einmalig importiert, jedoch nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Speicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster auf oberster Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Nicht-loopback-Control-UI-Deployments müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Origins). Private Same-Origin-LAN-/Tailnet-Ladevorgänge von loopback-, RFC1918-/link-local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne Host-Header-Fallback zu aktivieren.
    - Der Gateway-Start kann lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port setzen, entfernte Browser-Origins benötigen jedoch weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für eng kontrollierte lokale Tests. Es bedeutet, jede Browser-Origin zuzulassen, nicht „den Host abgleichen, den ich gerade verwende“.
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

Details zur Einrichtung des entfernten Zugriffs: [Entfernter Zugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
