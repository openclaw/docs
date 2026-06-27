---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für den Gateway (Chat, Aktivität, Knoten, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-06-27T18:23:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie spricht **direkt mit dem Gateway WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Auth wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-Identity-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identity-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Dashboard-Einstellungsfenster behält ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht persistiert. Onboarding erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für Shared-Secret-Auth, aber Passwort-Auth funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

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

Wenn der Browser die Kopplung mit geänderten Auth-Details (Rolle/Bereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Admin-Zugriff ändern, wird dies als Genehmigungs-Upgrade behandelt, nicht als stille Wiederverbindung. OpenClaw hält die alte Genehmigung aktiv, blockiert die weiter gefasste Wiederverbindung und fordert Sie auf, den neuen Bereichssatz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie es nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

Paperclip-Agenten, die über den `openclaw_gateway`-Adapter verbinden, verwenden denselben Genehmigungsablauf beim ersten Start. Führen Sie nach dem ersten Verbindungsversuch `openclaw devices approve --latest` aus, um die ausstehende Anfrage in der Vorschau zu prüfen, und führen Sie dann den ausgegebenen Befehl `openclaw devices approve <requestId>` erneut aus, um sie zu genehmigen. Übergeben Sie für ein entferntes Gateway explizite Werte für `--url` und `--token`. Um Genehmigungen über Neustarts hinweg stabil zu halten, konfigurieren Sie in Paperclip ein persistentes `adapterConfig.devicePrivateKeyPem`, anstatt bei jedem Lauf eine neue kurzlebige Geräteidentität erzeugen zu lassen.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann die Kopplungsrunde für Control UI-Bedienersitzungen überspringen, wenn `gateway.auth.allowTailscale: true` ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität präsentiert.
- Direkte Tailnet-Binds, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, sodass ein Browserwechsel oder das Löschen von Browserdaten eine erneute Kopplung erfordert.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsamen Sitzungen angehängt wird. Sie befindet sich im Browser-Speicher, ist auf das aktuelle Browserprofil beschränkt und wird nicht mit anderen Geräten synchronisiert oder serverseitig über die normale Transcript-Autorschaftsmetadaten für Nachrichten hinaus persistiert, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für das Override des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und durchlaufen niemals `config.patch`. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Laufzeitkonfigurations-Endpunkt

Die Control UI ruft ihre Laufzeiteinstellungen aus `/control-ui-config.json` ab, aufgelöst relativ zum Control UI-Basispfad des Gateway (zum Beispiel `/__openclaw__/control-ui-config.json`, wenn die UI unter `/__openclaw__/` bereitgestellt wird). Dieser Endpunkt wird durch dieselbe Gateway-Auth abgesichert wie der Rest der HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um sie später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Karte Gateway-Zugriff, nicht unter Darstellung.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht-englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Docs-Übersetzungen werden für denselben nicht-englischen Locale-Satz generiert, aber die integrierte Mintlify-Sprachauswahl der Docs-Website ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Docs werden weiterhin im Publish-Repo generiert; sie erscheinen möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemen

Das Darstellungsfenster behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Import-Slot. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in Darstellung ein. Der Importer akzeptiert auch Registry-URLs wie `https://tweakcn.com/r/themes/<id>`, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade `/themes/<id>`, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Darstellung enthält außerdem eine browserlokale Einstellung für die Textgröße. Die Einstellung wird zusammen mit den übrigen Control UI-Einstellungen gespeichert, gilt für Chat-Text, Composer-Text, Tool-Karten und Chat-Seitenleisten und hält Texteingaben bei mindestens 16px, damit Mobile Safari beim Fokussieren nicht automatisch zoomt.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen schaltet das aktive Theme wieder auf Claw zurück, falls das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Aktualisierungen des Chatverlaufs fordern ein begrenztes aktuelles Fenster mit Textobergrenzen pro Nachricht an, sodass große Sitzungen den Browser nicht zwingen, eine vollständige Transcript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Sprechen Sie über Echtzeit-Browsersitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Einmal-Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, `openclaw_agent_consult`-Provider-Toolaufrufe über `talk.client.toolCall` für Gateway-Policy und das größere konfigurierte OpenClaw-Modell weiterleitet und Sprachsteuerung für aktive Läufe über `talk.client.steer` oder `talk.session.steer` routet.
    - Toolaufrufe + Live-Tool-Ausgabekarten im Chat streamen (Agent-Ereignisse).
    - Aktivität-Tab mit browserlokalen, redaktionspriorisierten Zusammenfassungen der Live-Tool-Aktivität aus bestehender `session.tool`- / Tool-Ereigniszustellung.

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Dreams">
    - Kanäle: Status für integrierte sowie gebündelte/externe Plugin-Kanäle, QR-Anmeldung und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Aktualisierungen der Kanalprüfung halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und partielle Snapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit ihr UI-Budget überschreitet.
    - Instanzen: Präsenzliste + Aktualisierung (`system-presence`).
    - Sitzungen: Sitzungen konfigurierter Agenten standardmäßig auflisten, von veralteten unkonfigurierten Agent-Sitzungsschlüsseln zurückfallen und Modell-/Thinking-/Fast-/Verbose-/Trace-/Reasoning-Overrides pro Sitzung anwenden (`sessions.list`, `sessions.patch`).
    - Dreams: Dreaming-Status, Aktivieren/Deaktivieren-Schalter und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren + Ausführungshistorie (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: auflisten + Obergrenzen (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists bearbeiten + Ask-Policy für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - MCP hat eine eigene Einstellungsseite für konfigurierte Server, Aktivierung, OAuth-/Filter-/Parallel-Zusammenfassungen, gängige Bedienerbefehle und den bereichsbezogenen `mcp`-Konfigurationseditor.
    - Anwenden + mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung wecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Refs in der übermittelten Konfigurationsnutzlast; nicht aufgelöste aktive übermittelte Refs werden vor dem Schreiben abgelehnt.
    - Formularspeicherungen verwerfen veraltete redigierte Platzhalter, die nicht aus der gespeicherten Konfiguration wiederhergestellt werden können, während redigierte Werte erhalten bleiben, die weiterhin gespeicherten Geheimnissen zugeordnet sind.
    - Schema- + Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld `title` / `description`, passender UI-Hinweise, unmittelbarer untergeordneter Zusammenfassungen, Docs-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- + Kanalschemas, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher roundtrippen kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Reset to saved“ im Raw-JSON-Editor bewahrt die roh verfasste Struktur (Formatierung, Kommentare, `$include`-Layout), anstatt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher roundtrippen kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt dargestellt, um versehentliche Objekt-zu-String-Beschädigung zu verhindern.

  </Accordion>
  <Accordion title="Debug, Protokolle, Update">
    - Debug: Status-/Health-/Modelle-Snapshots + Ereignisprotokoll + manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control UI-Aktualisierungs-/RPC-Zeiten, langsame Chat-/Konfigurations-Renderzeiten und Einträge zur Browser-Reaktionsfähigkeit für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Protokolle: Live-Tail der Gateway-Dateiprotokolle mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update + Neustart (`update.run`) mit Neustartbericht ausführen, dann nach dem erneuten Verbinden `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Panel">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen eingestellt. Sie können zu Keine wechseln, wenn Sie nur interne Läufe wünschen.
    - Kanal-/Zielfelder werden angezeigt, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Hauptsitzungsjobs sind die Zustellmodi Webhook und Keine verfügbar.
    - Erweiterte Bearbeitungssteuerungen umfassen Nach-Ausführung-löschen, Agent-Überschreibung entfernen, exakte/gestaffelte Cron-Optionen, Agent-Modell-/Thinking-Überschreibungen und Best-Effort-Zustellschalter.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es ausgelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Legacy-Jobs mit `notify: true` von `cron.webhook` zu expliziter Webhook- oder Abschlusszustellung pro Job zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Betreiberansicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet MCP-Transporte nicht selbst; verwenden Sie sie, um gespeicherte Konfiguration zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie Live-Servernachweise benötigen.

Typischer Workflow:

1. Öffnen Sie **MCP** über die Seitenleiste.
2. Prüfen Sie die Zusammenfassungskarten für Gesamtzahl, aktivierte Server, OAuth und gefilterte Serverzahlen.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierung, Auth, Filter, Timeouts und Befehlshinweise.
4. Schalten Sie die Aktivierung um, wenn ein Server konfiguriert bleiben, aber nicht in der Laufzeiterkennung erscheinen soll.
5. Bearbeiten Sie den abgegrenzten `mcp`-Konfigurationsabschnitt für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Tool-Filter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern & Veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, wenn der bearbeitete Prozess statische Diagnosen, Live-Nachweise oder die Entsorgung einer gecachten Laufzeit benötigt.

Die Seite redigiert URL-ähnliche Werte, die Zugangsdaten enthalten, vor der Darstellung und setzt Servernamen in Befehlssnippets in Anführungszeichen, damit kopierte Befehle auch mit Leerzeichen oder Shell-Metazeichen funktionieren. Die vollständige CLI- und Konfigurationsreferenz finden Sie unter [MCP](/de/cli/mcp).

## Aktivitäts-Tab

Der Aktivitäts-Tab ist ein flüchtiger, browserlokaler Beobachter für Live-Tool-Aktivität. Er wird aus demselben Gateway-`session.tool`-/Tool-Ereignisstream abgeleitet, der Chat-Toolkarten speist; er fügt keine weitere Gateway-Ereignisfamilie, keinen Endpoint, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachterstream hinzu.

Aktivitätseinträge behalten nur bereinigte Zusammenfassungen und redigierte, gekürzte Ausgabevorschauen. Tool-Argumentwerte werden nicht im Aktivitätsstatus gespeichert; die UI zeigt an, dass Argumente ausgeblendet sind, und erfasst nur die Anzahl der Argumentfelder. Die speicherinterne Liste folgt dem aktuellen Browser-Tab, überlebt Navigation innerhalb der Control UI und wird beim Neuladen der Seite, Sitzungswechsel oder **Löschen** zurückgesetzt.

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Timing-Metadaten für lokale Diagnosen erhalten.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind aus UI-Sicherheitsgründen größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann der Seitenleser den vollständigen anzeige-normalisierten Transkripteintrag bei Bedarf über `chat.message.get` anhand von `sessionKey`, bei Bedarf aktivem `agentId` und Transkript-`messageId` abrufen. Wenn der Gateway weiterhin nicht mehr zurückgeben kann, zeigt der Leser einen expliziten Nicht-verfügbar-Zustand an, statt stillschweigend die gekürzte Vorschau zu wiederholen.
    - Vom Assistenten generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Neuladevorgänge nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Chatverlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI reine Anzeige-Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-Tool-Call-XML-Payloads (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur das exakte Silent-Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chatansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, falls `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Final-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agent-Filter vor der Sitzungsauswahl an, und die Sitzungsauswahl ist auf den ausgewählten Agent beschränkt. Beim Wechseln von Agents werden nur Sitzungen angezeigt, die mit diesem Agent verknüpft sind, und es wird auf die Hauptsitzung dieses Agents zurückgegriffen, wenn er noch keine gespeicherten Dashboard-Sitzungen hat.
    - Auf Desktop-Breiten bleiben Chatsteuerungen in einer kompakten Zeile und klappen beim Herunterscrollen im Transkript ein; Heraufscrollen, Zurückkehren zum Anfang oder Erreichen des Endes stellt die Steuerungen wieder her.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Blase mit Zähl-Badge dargestellt. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht zusammengeklappt.
    - Die Modell- und Thinking-Auswahlen im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine Nur-für-einen-Turn-Sendeoptionen.
    - Wenn Sie eine Nachricht senden, während eine Änderung der Modellauswahl für dieselbe Sitzung noch gespeichert wird, wartet der Composer auf diesen Sitzungs-Patch, bevor er `chat.send` aufruft, damit der Sendevorgang das ausgewählte Modell verwendet.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe frische Dashboard-Sitzung wie Neuer Chat und wechselt zu ihr, außer wenn `session.dmScope: "main"` konfiguriert ist und der aktuelle Parent die Hauptsitzung des Agents ist; in diesem Fall wird die Hauptsitzung direkt zurückgesetzt. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl, einschließlich `provider/*`-Einträgen, die Provider-bezogene Kataloge dynamisch halten. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge plus Provider mit nutzbarer Auth an. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte aktuelle Kontext-Token enthalten, zeigt der Chat-Composer-Bereich einen kompakten Kontextnutzungsindikator an. Er wechselt bei hohem Kontextdruck zu Warnstil und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche an, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway wieder frische Nutzung meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus einem `openai`-API-Key-Auth-Profil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`; OpenAI-OAuth-Profile konfigurieren keine Realtime-Sprache. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält nie einen standardmäßigen Provider-API-Key. OpenAI erhält ein flüchtiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmal verwendbares, eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Vendor-Sockets serverseitig bleiben, während Browseraudio über authentifizierte Gateway-RPCs läuft. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Der Chat-Composer enthält neben der Start-/Stopp-Schaltfläche für Talk eine Talk-Optionsschaltfläche. Die Optionen gelten für die nächste Talk-Sitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Präfix-Padding überschreiben. Wenn eine Option leer ist, verwendet der Gateway konfigurierte Standardwerte, sofern verfügbar, oder den Provider-Standard. Die Auswahl von Gateway-Relay erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung clientseitig und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browsersitzung erstellen kann.

    Im Chat-Composer ist die Talk-Steuerung die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Realtime-Tool-Call über `talk.client.toolCall` das konfigurierte größere Modell konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Einrichtung eines eingeschränkten Token-Browser-WebSockets und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stoppen** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer eingereihten Nachricht auf **Steuern**, um diese Folgeanfrage in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des normalen Bandes abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Abbruch-Teilergebnissen">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistententext weiterhin in der UI angezeigt werden.
    - Gateway persistiert abgebrochenen teilweisen Assistententext in der Transkript-Historie, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptverbraucher Abbruch-Teilergebnisse von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einem OpenClaw-Update **Protokollkonflikt** anzeigt, öffnen Sie zuerst das Dashboard erneut mit `openclaw dashboard` und führen Sie ein hartes Neuladen der Seite durch. Wenn es weiterhin fehlschlägt, löschen Sie die Websitedaten für den Dashboard-Origin oder testen Sie in einem privaten Browserfenster; ein alter Tab oder Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle von vor dem Update gegen den neueren Gateway ausführen.

| Oberfläche                                           | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-State-Verzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel fest vorgeben möchten (für Multi-Host-Deployments, Geheimnis-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `https://openclaw.ai`)

Die Control UI verwendet diese scope-geschützten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützte Push-Benachrichtigungen) und von der vorhandenen Methode `push.test`, die auf natives mobiles Pairing abzielen.
</Note>

## Gehostete Embeds

Assistant-Nachrichten können gehostete Webinhalte inline mit dem `[embed ...]`-Shortcode rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Embeds.
  </Tab>
  <Tab title="scripts (default)">
    Erlaubt interaktive Embeds bei beibehaltener Origin-Isolation; dies ist der Standard und reicht normalerweise für eigenständige Browser-Spiele/Widgets aus.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument wirklich Same-Origin-Verhalten benötigt. Für die meisten agent-generierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Embed-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Seiten von Drittanbietern lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chat-Nachrichten

Gruppierte Chat-Nachrichten verwenden eine gut lesbare Standard-Maximalbreite. Wide-Monitor-Deployments können sie ohne Patchen des gebündelten CSS überschreiben, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentangaben wie `960px` oder `82%` sowie beschränkte Breiten-Ausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Lassen Sie den Gateway auf loopback und überlassen Sie Tailscale Serve das HTTPS-Proxying:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Standardmäßig können Control UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw überprüft die Identität, indem es die `x-forwarded-for`-Adresse mit `tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die Anfrage loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Für Control UI-Operator-Sessions mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Device-Pairing-Roundtrip; Browser ohne Gerät und Node-Rollen-Verbindungen folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Anmeldedaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope serialisiert, bevor Rate-Limit-Schreibvorgänge erfolgen. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host laufen kann, verlangen Sie Token-/Passwort-Authentifizierung.
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

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- nur localhost betreffende unsichere HTTP-Kompatibilität mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
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

    `allowInsecureAuth` ist nur ein lokaler Kompatibilitäts-Schalter:

    - Er erlaubt localhost-Control UI-Sessions, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht localhost) Verbindungen.

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine gravierende Sicherheitsherabstufung. Setzen Sie dies nach dem Notfalleinsatz schnell zurück.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control UI-Sessions ohne Geräteidentität zulassen.
    - Dies erstreckt sich **nicht** auf Control UI-Sessions mit Node-Rolle.
    - Same-Host-loopback-Reverse-Proxys erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Erlaubt sind nur **same-origin**-Assets, `data:`-URLs und lokal generierte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser verworfen und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Channel-Metadaten ausgegeben werden, werden in den Avatar-Helpern der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus dem Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verlangt der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der verwandten Assistant-Media-Route). Dies verhindert, dass die Avatar-Route auf ansonsten geschützten Hosts die Agent-Identität preisgibt.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, im Einklang mit dem Rest des Gateways.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistants eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Control UI-Operator-Authentifizierung. Der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt normales Medienrendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbare Medien-URLs zu legen.

## UI erstellen

Der Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

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

## Leere Control UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen hilfreichen Fehler zeigt, hat möglicherweise eine Erweiterung oder ein frühes Content-Skript verhindert, dass die JavaScript-Modul-App ausgewertet wird. Die statische Seite enthält ein einfaches HTML-Wiederherstellungspanel, das erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie die Aktion **Erneut versuchen** des Panels, nachdem Sie die Browserumgebung geändert haben, oder laden Sie nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die in alle Seiten injizieren, insbesondere Erweiterungen mit `<all_urls>`-Content-Skripten.
- Versuchen Sie ein privates Fenster, ein sauberes Browserprofil oder einen anderen Browser.
- Lassen Sie den Gateway laufen und prüfen Sie dieselbe Dashboard-URL nach der Browseränderung erneut.

## Debugging/Testen: Dev-Server + entfernter Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, der Gateway aber anderswo läuft.

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

    Optionale einmalige Authentifizierung (falls nötig):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Hinweise">
    - `gatewayUrl` wird nach dem Laden in localStorage gespeichert und aus der URL entfernt.
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-codieren Sie den Wert `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt analysiert.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks über Anfrage-Logs und Referer vermieden werden. Legacy-Query-Parameter `?token=` werden zur Kompatibilität weiterhin einmalig importiert, aber nur als Fallback, und direkt nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Credentials zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Credentials sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich der Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster auf oberster Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Nicht-Loopback-Bereitstellungen der Control UI müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Origins). Private Same-Origin-Ladevorgänge aus LAN/Tailnet von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
    - Beim Start kann der Gateway lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und -Port setzen, aber Origins entfernter Browser benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Origin zu erlauben, nicht „den Host abzugleichen, den ich gerade verwende“.
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

Details zur Einrichtung des Remote-Zugriffs: [Remote-Zugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Integritätsprüfungen](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chatoberfläche
