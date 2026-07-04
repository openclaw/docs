---
read_when:
    - Sie möchten den Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für den Gateway (Chat, Aktivität, Knoten, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-07-04T20:29:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
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

<Note>
Bei nativen Windows-LAN-Bindungen können Windows Firewall oder per Organisation verwaltete Gruppenrichtlinien die angekündigte LAN-URL weiterhin blockieren, selbst wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, Profilabweichungen und lokale Firewallregeln, die von Richtlinien möglicherweise ignoriert werden.
</Note>

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identitäts-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitäts-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungen-Panel des Dashboards behält ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht gespeichert. Das Onboarding generiert in der Regel beim ersten Verbinden ein Gateway-Token für Shared-Secret-Authentifizierung, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsgenehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen werden:** „disconnected (1008): pairing required“

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

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff ändern, wird dies als Genehmigungs-Upgrade behandelt, nicht als stille Wiederverbindung. OpenClaw lässt die alte Genehmigung aktiv, blockiert die umfassendere Wiederverbindung und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie sie nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

Paperclip-Agenten, die sich über den Adapter `openclaw_gateway` verbinden, verwenden denselben Genehmigungsablauf beim ersten Start. Führen Sie nach dem ersten Verbindungsversuch `openclaw devices approve --latest` aus, um die ausstehende Anfrage in der Vorschau anzuzeigen, und führen Sie dann den ausgegebenen Befehl `openclaw devices approve <requestId>` erneut aus, um sie zu genehmigen. Übergeben Sie für ein entferntes Gateway explizite Werte für `--url` und `--token`. Um Genehmigungen über Neustarts hinweg stabil zu halten, konfigurieren Sie in Paperclip eine persistente `adapterConfig.devicePrivateKeyPem`, statt bei jedem Lauf eine neue kurzlebige Geräteidentität generieren zu lassen.

<Note>
- Direkte lokale local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Kopplungs-Roundtrip für Control UI-Bedienersitzungen überspringen, wenn `gateway.auth.allowTailscale: true` ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil generiert eine eindeutige Geräte-ID; ein Browserwechsel oder das Löschen von Browserdaten erfordert daher eine erneute Kopplung.

</Note>

## Ein Mobilgerät koppeln

Ein bereits gekoppelter Administrator kann den iOS-/Android-Verbindungs-QR erstellen, ohne
ein Terminal zu öffnen:

<Steps>
  <Step title="Mobile Kopplung öffnen">
    Wählen Sie **Knoten** aus und klicken Sie dann in der Karte **Geräte** auf **Mobilgerät koppeln**.
  </Step>
  <Step title="Das Telefon verbinden">
    Öffnen Sie in der mobilen OpenClaw-App **Einstellungen** → **Gateway** und scannen Sie den QR-
    Code. Sie können stattdessen den Einrichtungscode kopieren und einfügen.
  </Step>
  <Step title="Die Verbindung bestätigen">
    Die offizielle iOS-/Android-App verbindet sich automatisch. Wenn **Geräte** eine
    ausstehende Anfrage anzeigt, prüfen Sie deren Rolle und Scopes, bevor Sie sie genehmigen.
  </Step>
</Steps>

Das Erstellen eines Einrichtungscodes erfordert `operator.admin`; die Schaltfläche ist für
Sitzungen ohne diese Berechtigung deaktiviert. Ein Einrichtungscode enthält eine kurzlebige Bootstrap-Anmeldeinformation,
behandeln Sie den QR und den kopierten Code daher wie ein Passwort, solange sie gültig sind. Für die entfernte
Kopplung muss das Gateway zu `wss://` auflösen (zum Beispiel über Tailscale
Serve/Funnel); einfaches `ws://` ist auf Loopback- und private LAN-Adressen beschränkt.
Siehe [Kopplung](/de/channels/pairing#pair-from-the-control-ui-recommended) für die
vollständigen Sicherheits- und Fallback-Details.

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine browserbezogene persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in geteilten Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normale Autorenschaftsmetadaten von tatsächlich gesendeten Nachrichten hinaus gespeichert. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistant-Avatars. Hochgeladene Assistant-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und werden nie über `config.patch` zurückgesendet. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt weiterhin für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. geskriptete Gateways oder benutzerdefinierte Dashboards).

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Runtime-Einstellungen von `/control-ui-config.json` ab, relativ zum Control UI-Basispfad des Gateways aufgelöst (zum Beispiel `/__openclaw__/control-ui-config.json`, wenn die UI unter `/__openclaw__/` bereitgestellt wird). Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Karte Gateway-Zugriff, nicht unter Darstellung.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht-englische Übersetzungen werden im Browser per Lazy Loading geladen.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Doku-Übersetzungen werden für denselben nicht-englischen Locale-Satz generiert, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repo generiert; sie erscheint möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungs-Panel behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Import-Slot. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in Darstellung ein. Der Importer akzeptiert auch `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade `/themes/<id>`, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Darstellung enthält außerdem eine browserlokale Einstellung für die Textgröße. Die Einstellung wird zusammen mit den übrigen Control UI-Einstellungen gespeichert, gilt für Chattext, Composer-Text, Tool-Karten und Chat-Seitenleisten und hält Texteingaben bei mindestens 16px, damit mobiles Safari beim Fokussieren nicht automatisch zoomt.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Leeren schaltet das aktive Theme wieder auf Claw zurück, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Sprechen">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Aktualisierungen des Chatverlaufs fordern ein begrenztes aktuelles Fenster mit Textobergrenzen pro Nachricht an, damit große Sitzungen den Browser nicht zwingen, eine vollständige Transkript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Einmal-Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay hält Provider-Anmeldeinformationen auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, `openclaw_agent_consult`-Provider-Toolaufrufe über `talk.client.toolCall` für Gateway-Richtlinien und das größere konfigurierte OpenClaw-Modell weiterleitet und Sprachsteuerung für aktive Läufe über `talk.client.steer` oder `talk.session.steer` routet.
    - Toolaufrufe + Live-Tool-Ausgabekarten im Chat streamen (Agentenereignisse).
    - Aktivitäts-Tab mit browserlokalen, auf Schwärzung ausgerichteten Zusammenfassungen der Live-Toolaktivität aus vorhandener `session.tool`- / Tool-Ereigniszustellung.

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: integrierter Status plus Status gebündelter/externer Plugin-Kanäle, QR-Anmeldung und Konfiguration pro Kanal (`channels.status`, `web.login.*`, `config.patch`).
    - Aktualisierungen von Kanalprüfungen halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und Teilsnapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit das UI-Budget überschreitet.
    - Instanzen: Anwesenheitsliste + Aktualisierung (`system-presence`).
    - Sitzungen: konfigurierten Agentensitzungen standardmäßig auflisten, häufige Sitzungen anheften, umbenennen, inaktive Sitzungen archivieren oder wiederherstellen, von veralteten Sitzungsschlüsseln nicht konfigurierter Agenten zurückfallen und modell-/thinking-/fast-/verbose-/trace-/reasoning-Überschreibungen pro Sitzung anwenden (`sessions.list`, `sessions.patch`). Angeheftete Sitzungen werden oberhalb aktueller nicht angehefteter Sitzungen sortiert; archivierte Sitzungen befinden sich in der Archivansicht der Sitzungsseite und behalten ihre Transkripte.
    - Träume: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Dream Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Knoten, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Knoten: auflisten + Obergrenzen (`node.list`), mobile Einrichtungscodes erstellen und Gerätekopplung genehmigen (`device.pair.*`).
    - Exec-Genehmigungen: Allowlists für Gateway oder Knoten bearbeiten + Abfragerichtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - MCP hat eine eigene Einstellungsseite für konfigurierte Server, Aktivierung, OAuth-/Filter-/Parallel-Zusammenfassungen, gängige Operator-Befehle und den bereichsbezogenen `mcp`-Konfigurationseditor.
    - Anwenden + Neustart mit Validierung (`config.apply`) und die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen die aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurationsnutzlast vorab; nicht aufgelöste aktive übermittelte Refs werden vor dem Schreiben abgelehnt.
    - Form-Speicherungen verwerfen veraltete redigierte Platzhalter, die aus der gespeicherten Konfiguration nicht wiederhergestellt werden können, während redigierte Werte erhalten bleiben, die weiterhin gespeicherten Secrets zugeordnet sind.
    - Schema- + Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, übereinstimmender UI-Hinweise, unmittelbarer untergeordneter Zusammenfassungen, Docs-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten, plus Plugin- + Channel-Schemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher per Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - Der Raw-JSON-Editor „Auf Gespeichertes zurücksetzen“ bewahrt die raw verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen einen Reset überstehen, wenn der Snapshot sicher per Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um versehentliche Objekt-zu-String-Beschädigungen zu verhindern.

  </Accordion>
  <Accordion title="Debug, Logs, Update">
    - Debug: Status-/Integritäts-/Modell-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control-UI-Aktualisierungs-/RPC-Timings, langsame Chat-/Konfigurations-Render-Timings und Einträge zur Browser-Reaktionsfähigkeit für lange Animationsframes oder Long Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Datei-Logs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update + Neustart (`update.run`) mit Neustartbericht ausführen, dann nach der Wiederverbindung `update.status` abfragen, um die laufende Gateway-Version zu überprüfen.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Panel">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Ankündigungszusammenfassung eingestellt. Sie können auf „Keine“ umstellen, wenn Sie rein interne Läufe wünschen.
    - Channel-/Ziel-Felder werden angezeigt, wenn „Ankündigen“ ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Hauptsitzungs-Jobs sind die Zustellmodi Webhook und „Keine“ verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Nach-Ausführung-löschen, Agent-Override löschen, exakte/gestaffelte Cron-Optionen, Agent-Modell-/Thinking-Overrides und Best-Effort-Zustellungsumschalter.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es ausgelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Legacy-Jobs mit `notify: true` von `cron.webhook` zu expliziter Webhook- oder Abschlusszustellung pro Job zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operator-Ansicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet keine MCP-Transporte selbst; verwenden Sie sie, um gespeicherte Konfigurationen zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie einen Live-Server-Nachweis benötigen.

Typischer Workflow:

1. Öffnen Sie **MCP** über die Seitenleiste.
2. Prüfen Sie die Übersichtskarten für Gesamtzahl, aktivierte Server, OAuth und gefilterte Serveranzahlen.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierung, Auth, Filter, Timeouts und Befehlshinweise.
4. Schalten Sie die Aktivierung um, wenn ein Server konfiguriert bleiben, aber von der Runtime-Erkennung ausgeschlossen sein soll.
5. Bearbeiten Sie den bereichsbezogenen `mcp`-Konfigurationsabschnitt für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Tool-Filter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern & Veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, wenn der bearbeitete Prozess statische Diagnosen, Live-Nachweis oder das Verwerfen einer zwischengespeicherten Runtime benötigt.

Die Seite redigiert zugangsdatenhaltige URL-ähnliche Werte vor dem Rendering und setzt Servernamen in Befehlsschnipseln in Anführungszeichen, sodass kopierte Befehle auch mit Leerzeichen oder Shell-Metazeichen funktionieren. Die vollständige CLI- und Konfigurationsreferenz finden Sie unter [MCP](/de/cli/mcp).

## Aktivitäts-Tab

Der Aktivitäts-Tab ist ein flüchtiger, browserlokaler Beobachter für Live-Tool-Aktivität. Er wird aus demselben Gateway-`session.tool`- / Tool-Ereignisstream abgeleitet, der Chat-Tool-Karten antreibt; er fügt keine weitere Gateway-Ereignisfamilie, keinen Endpoint, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachterstream hinzu.

Aktivitätseinträge behalten nur bereinigte Zusammenfassungen und redigierte, gekürzte Ausgabevorschauen. Tool-Argumentwerte werden nicht im Aktivitätszustand gespeichert; die UI zeigt an, dass Argumente ausgeblendet sind, und zeichnet nur die Anzahl der Argumentfelder auf. Die speicherinterne Liste folgt dem aktuellen Browser-Tab, übersteht Navigation innerhalb der Control UI und wird bei Seitenneuladen, Sitzungswechsel oder **Löschen** zurückgesetzt.

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Senden- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort streamt über `chat`-Ereignisse. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Timing-Metadaten für lokale Diagnosen erhalten.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter (`[chat.history omitted: message too large]`) ersetzen.
    - Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann der Seitenleser den vollständigen anzeigennormalisierten Transkripteintrag bei Bedarf über `chat.message.get` anhand von `sessionKey`, aktivem `agentId` falls erforderlich und Transkript-`messageId` abrufen. Wenn Gateway weiterhin nicht mehr zurückgeben kann, zeigt der Leser einen expliziten Nicht-verfügbar-Zustand, statt stillschweigend die gekürzte Vorschau zu wiederholen.
    - Vom Assistenten generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgeliefert, sodass Neuladevorgänge nicht davon abhängen, dass rohe base64-Bildnutzlasten in der Chat-Verlaufsantwort erhalten bleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI reine Anzeige-Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-Tool-Call-XML-Nutzlasten (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstokens und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur aus dem exakten stillen Token `NO_REPLY` / `no_reply` oder dem Heartbeat-Bestätigungstoken `HEARTBEAT_OK` besteht.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind Zustellungsstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach finalen Tool-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Ausläufer zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Updates (kein Agent-Lauf, keine Channel-Zustellung).
    - Die Seitenleiste listet aktuelle Sitzungen mit einer Aktion „Neue Sitzung“, einem Link „Alle Sitzungen“ und einer Sitzungssuchschaltfläche auf, die den vollständigen Sitzungsauswähler öffnet (begrenzt auf den ausgewählten Agent, mit Suche und Paginierung). Beim Wechseln von Agenten werden nur Sitzungen angezeigt, die diesem Agent zugeordnet sind; wenn noch keine Dashboard-Sitzungen gespeichert sind, wird auf die Hauptsitzung dieses Agenten zurückgegriffen.
    - Jede Zeile im Sitzungsauswähler kann die Sitzung umbenennen, anheften oder archivieren. Ein aktiver Lauf und die Hauptsitzung eines Agenten können nicht archiviert werden. Wird die aktuell ausgewählte Sitzung archiviert, wechselt Chat zurück zur Hauptsitzung dieses Agenten.
    - Bei Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; beim Hochscrollen, beim Zurückkehren nach oben oder beim Erreichen des unteren Endes werden die Steuerelemente wiederhergestellt.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Sprechblase mit einem Zähl-Badge gerendert. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht eingeklappt.
    - Die Modell- und Thinking-Auswähler im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungs-Overrides, keine nur für einen Turn geltenden Sendeoptionen.
    - Wenn Sie eine Nachricht senden, während eine Änderung am Modellauswähler für dieselbe Sitzung noch gespeichert wird, wartet der Composer auf diesen Sitzungs-Patch, bevor `chat.send` aufgerufen wird, damit der Sendevorgang das ausgewählte Modell verwendet.
    - Wenn Sie in der Control UI `/new` eingeben, wird dieselbe frische Dashboard-Sitzung wie bei „Neuer Chat“ erstellt und dorthin gewechselt, außer wenn `session.dmScope: "main"` konfiguriert ist und der aktuelle Parent die Hauptsitzung des Agenten ist; in diesem Fall wird die Hauptsitzung an Ort und Stelle zurückgesetzt. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Der Chat-Modellauswähler fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist den Auswähler, einschließlich `provider/*`-Einträgen, die provider-bezogene Kataloge dynamisch halten. Andernfalls zeigt der Auswähler explizite `models.providers.*.models`-Einträge sowie Provider mit verwendbarer Auth an. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte aktuelle Kontexttokens enthalten, zeigt die Chat-Composer-Symbolleiste einen kleinen Kontextnutzungsring mit dem verwendeten Prozentsatz; die vollständigen Token-Details befinden sich im Tooltip. Der Ring wechselt bei hohem Kontextdruck zu Warn-Styling und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzung-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis Gateway erneut frische Nutzung meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus einem `openai`-API-Key-Auth-Profil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`; OpenAI-OAuth-Profile konfigurieren keine Echtzeit-Sprache. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen Standard-Provider-API-Key. OpenAI erhält ein flüchtiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmal verwendbares eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token festgeschrieben werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungsprompt wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Instruction-Overrides.

    Der Chat-Composer enthält neben der Schaltfläche zum Starten/Stoppen von Talk eine Schaltfläche für Talk-Optionen. Die Optionen gelten für die nächste Talk-Sitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Präfix-Padding überschreiben. Wenn eine Option leer ist, verwendet der Gateway konfigurierte Standardwerte, sofern verfügbar, oder den Provider-Standard. Die Auswahl von Gateway-Relay erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung im Besitz des Clients und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browser-Sitzung erstellen kann.

    Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Statuszeile des Composers `Connecting Talk...`, anschließend `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf über `talk.client.toolCall` das konfigurierte größere Modell abfragt.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Browser-WebSocket-Einrichtung mit eingeschränkten Tokens und den Gateway-Relay-Browser-Adapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Geheimnisse.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stoppen** (ruft `chat.abort` auf).
    - Während ein Run aktiv ist, werden normale Anschlussnachrichten in die Warteschlange gestellt. Klicken Sie bei einer Nachricht in der Warteschlange auf **Steuern**, um diese Anschlussnachricht in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchformulierungen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (kein `runId`), um alle aktiven Runs für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Aufbewahrung von Abbruch-Teilinhalten">
    - Wenn ein Run abgebrochen wird, kann Teiltext des Assistenten weiterhin in der UI angezeigt werden.
    - Der Gateway persistiert abgebrochenen Teiltext des Assistenten im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten Abbruch-Teilinhalte von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker mit, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einem OpenClaw-Update **Protocol mismatch** anzeigt, öffnen Sie zuerst das Dashboard mit `openclaw dashboard` erneut und führen Sie eine harte Aktualisierung der Seite durch. Wenn es weiterhin fehlschlägt, löschen Sie die Websitedaten für den Dashboard-Origin oder testen Sie in einem privaten Browserfenster; ein alter Tab oder ein Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle vor dem Update gegen den neueren Gateway ausführen.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-State-Verzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel fest pinnen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `https://openclaw.ai`)

Die Control UI verwendet diese Scope-geschützten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützten Push) und der vorhandenen Methode `push.test`, die auf natives Mobile-Pairing abzielen.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen, während die Origin-Isolation erhalten bleibt; dies ist die Standardeinstellung und reicht in der Regel für eigenständige Browserspiele/Widgets aus.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten agentengenerierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chat-Nachrichten

Gruppierte Chat-Nachrichten verwenden eine gut lesbare standardmäßige Maximalbreite. Deployments mit breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

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
    Halten Sie den Gateway auf local loopback und lassen Sie Tailscale Serve ihn mit HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitäts-Header (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem die Adresse `x-forwarded-for` mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage local loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control-UI-Operatorsitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Device-Pairing-Roundtrip; gerätelose Browser und Node-Rollen-Verbindungen folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope serialisiert, bevor Rate-Limit-Schreibvorgänge erfolgen. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host laufen kann, verlangen Sie Token-/Passwort-Authentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur-localhost-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

<AccordionGroup>
  <Accordion title="Verhalten des Unsicher-Auth-Toggles">
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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine schwerwiegende Sicherheitsabsenkung. Machen Sie dies nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu Trusted Proxy">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies erstreckt sich **nicht** auf Control-UI-Sitzungen mit Node-Rolle.
    - Same-Host-local loopback-Reverse-Proxys erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Nur Assets mit **gleichem Origin**, `data:`-URLs und lokal generierte `blob:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads im Protokoll).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Kanalmetadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dies verhindert, dass die Avatar-Route die Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route unauthentifiziert, entsprechend dem restlichen Gateway.

## Routenauthentifizierung für Assistant-Medien

Wenn die Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistant eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Im Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` statt des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt das normale Medien-Rendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Zugangsdaten in sichtbare Medien-URLs einzubetten.

## UI erstellen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für die lokale Entwicklung (separater Entwicklungsserver):

```bash
pnpm ui:dev
```

Richten Sie die UI anschließend auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Leere Control-UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen hilfreichen Fehler anzeigt, hat möglicherweise eine Erweiterung oder ein früh ausgeführtes Content-Script verhindert, dass die JavaScript-Modul-App ausgewertet wird. Die statische Seite enthält ein einfaches HTML-Wiederherstellungspanel, das erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie die Aktion **Erneut versuchen** des Panels, nachdem Sie die Browserumgebung geändert haben, oder laden Sie nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die in alle Seiten injizieren, insbesondere Erweiterungen mit `<all_urls>`-Content-Scripts.
- Versuchen Sie es mit einem privaten Fenster, einem sauberen Browserprofil oder einem anderen Browser.
- Lassen Sie das Gateway laufen und überprüfen Sie nach der Browseränderung dieselbe Dashboard-URL.

## Debugging/Tests: Entwicklungsserver + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Entwicklungsserver lokal verwenden möchten, das Gateway aber an anderer Stelle läuft.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` wird nach dem Laden in localStorage gespeichert und aus der URL entfernt.
    - Wenn Sie einen vollständigen `ws://`- oder `wss://`-Endpunkt über `gatewayUrl` übergeben, URL-codieren Sie den Wert von `gatewayUrl`, damit der Browser den Query-String korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrageprotokollen und im Referer vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und direkt nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Control-UI-Bereitstellungen ohne Loopback müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Ursprünge). Private Same-Origin-LAN-/Tailnet-Ladevorgänge von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
    - Der Gateway-Start kann lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port übernehmen, aber entfernte Browser-Ursprünge benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nicht, außer für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zu erlauben, nicht „den Host abgleichen, den ich gerade verwende“.
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

Details zur Einrichtung des Fernzugriffs: [Fernzugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Überwachung des Zustands
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
