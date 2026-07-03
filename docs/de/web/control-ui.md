---
read_when:
    - Sie möchten den Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungs-UI für den Gateway (Chat, Aktivität, Knoten, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-07-03T09:34:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit** Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

<Note>
Bei nativen Windows-LAN-Bindings können die Windows-Firewall oder per Organisation verwaltete Gruppenrichtlinien die angekündigte LAN-URL weiterhin blockieren, auch wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, Profilabweichungen und lokale Firewall-Regeln, die von Richtlinien möglicherweise ignoriert werden.
</Note>

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- vertrauenswürdige Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfeld des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht persistent gespeichert. Das Onboarding erzeugt beim ersten Verbindungsaufbau normalerweise ein Gateway-Token für die Authentifizierung per gemeinsamem Geheimnis, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsfreigabe**. Das ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): pairing required“

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails wiederholt (Rolle/Berechtigungsbereiche/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Freigabe erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Administratorzugriff ändern, wird dies als Freigabe-Upgrade behandelt, nicht als stiller Neuverbindungsaufbau. OpenClaw hält die alte Freigabe aktiv, blockiert den breiteren Neuverbindungsversuch und fordert Sie auf, den neuen Berechtigungsumfang ausdrücklich freizugeben.

Nach der Freigabe wird das Gerät gespeichert und erfordert keine erneute Freigabe, es sei denn, Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Geräte-CLI](/de/cli/devices) für Tokenrotation und Widerruf.

Paperclip-Agenten, die sich über den `openclaw_gateway`-Adapter verbinden, verwenden denselben Freigabefluss beim ersten Start. Führen Sie nach dem ersten Verbindungsversuch `openclaw devices approve --latest` aus, um die ausstehende Anfrage vorab anzuzeigen, und führen Sie anschließend den ausgegebenen Befehl `openclaw devices approve <requestId>` erneut aus, um sie freizugeben. Übergeben Sie explizite Werte für `--url` und `--token` für ein entferntes Gateway. Damit Freigaben über Neustarts hinweg stabil bleiben, konfigurieren Sie in Paperclip einen persistenten `adapterConfig.devicePrivateKeyPem`, anstatt bei jedem Lauf eine neue kurzlebige Geräteidentität erzeugen zu lassen.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch freigegeben.
- Tailscale Serve kann den Kopplungs-Roundtrip für Control-UI-Bediensitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindings, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Freigabe.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID; beim Wechsel des Browsers oder beim Löschen von Browserdaten ist daher eine erneute Kopplung erforderlich.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in geteilten Sitzungen angehängt wird. Sie liegt im Browser-Speicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normale Metadaten-Autorschaft von Transkripten für tatsächlich gesendete Nachrichten hinaus gespeichert. Das Löschen von Websitedaten oder der Wechsel des Browsers setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und laufen nie über `config.patch` zurück. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt weiterhin für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Laufzeit-Konfigurationsendpunkt

Die Control UI ruft ihre Laufzeiteinstellungen von `/control-ui-config.json` ab, relativ zum Control-UI-Basispfad des Gateways aufgelöst (zum Beispiel `/__openclaw__/control-ui-config.json`, wenn die UI unter `/__openclaw__/` bereitgestellt wird). Dieser Endpunkt ist durch dieselbe Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/-Passwort, eine Tailscale-Serve-Identität oder eine vertrauenswürdige Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um sie später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Karte „Gateway-Zugriff“, nicht unter „Darstellung“.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browser-Speicher gespeichert und bei zukünftigen Besuchen erneut verwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für denselben nicht englischen Locale-Satz erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes begrenzt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repo erzeugt; sie erscheint möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungsfeld behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Import-Slot bei. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen**, und fügen Sie den kopierten Theme-Link in „Darstellung“ ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade `/themes/<id>`, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

„Darstellung“ enthält außerdem eine browserlokale Einstellung für die Textgröße. Die Einstellung wird zusammen mit den übrigen Control-UI-Einstellungen gespeichert, gilt für Chat-Text, Composer-Text, Tool-Karten und Chat-Seitenleisten und hält Texteingaben bei mindestens 16px, damit Mobile Safari beim Fokussieren nicht automatisch zoomt.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen schaltet das aktive Theme zurück auf Claw, falls das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Aktualisierungen des Chatverlaufs fordern ein begrenztes aktuelles Fenster mit Textbegrenzungen pro Nachricht an, damit große Sitzungen den Browser nicht zwingen, eine vollständige Transkript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Über Echtzeitsitzungen im Browser sprechen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Einmal-Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, `openclaw_agent_consult`-Provider-Toolaufrufe über `talk.client.toolCall` für Gateway-Richtlinien und das größere konfigurierte OpenClaw-Modell weiterleitet und Sprachsteuerung aktiver Läufe über `talk.client.steer` oder `talk.session.steer` routet.
    - Toolaufrufe und Live-Tool-Ausgabekarten im Chat streamen (Agent-Ereignisse).
    - Aktivitäts-Tab mit browserlokalen, redaktionsfreundlichen Zusammenfassungen von Live-Tool-Aktivitäten aus vorhandener `session.tool`-/Tool-Ereigniszustellung.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und Konfiguration pro Kanal (`channels.status`, `web.login.*`, `config.patch`).
    - Aktualisierungen von Kanalprüfungen halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und Teilsnapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit ihr UI-Budget überschreitet.
    - Instanzen: Präsenzliste und Aktualisierung (`system-presence`).
    - Sitzungen: Sitzungen konfigurierter Agenten standardmäßig auflisten, von veralteten Sitzungsschlüsseln nicht konfigurierter Agenten zurückfallen und modell-/thinking-/fast-/verbose-/trace-/reasoning-Überschreibungen pro Sitzung anwenden (`sessions.list`, `sessions.patch`).
    - Dreams: Dreaming-Status, Aktivieren/Deaktivieren-Schalter und Dream-Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren sowie Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: Liste und Caps (`node.list`).
    - Exec-Freigaben: Gateway- oder Node-Zulassungslisten und Abfragerichtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - MCP hat eine eigene Einstellungsseite für konfigurierte Server, Aktivierung, OAuth-/Filter-/Parallel-Zusammenfassungen, gängige Operatorbefehle und den bereichsspezifischen `mcp`-Konfigurationseditor.
    - Anwenden und mit Validierung neu starten (`config.apply`) und die zuletzt aktive Sitzung wecken.
    - Schreibvorgänge enthalten einen Basishash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die Auflösung aktiver SecretRef-Einträge für Referenzen in der übermittelten Konfigurationsnutzlast; nicht auflösbare aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Formularspeicherungen verwerfen veraltete redigierte Platzhalter, die aus der gespeicherten Konfiguration nicht wiederhergestellt werden können, während redigierte Werte erhalten bleiben, die weiterhin gespeicherten Geheimnissen zugeordnet sind.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, unmittelbarer Kindzusammenfassungen, Dokumentationsmetadaten für verschachtelte Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- und Kanalschemata, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Rohtext nicht sicher per Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Reset to saved“ im Raw-JSON-Editor erhält die roh verfasste Struktur (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher per Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um eine versehentliche Objekt-zu-String-Beschädigung zu verhindern.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control-UI-Aktualisierungs-/RPC-Zeitmessungen, Zeitmessungen für langsames Chat-/Konfigurations-Rendering und Einträge zur Browser-Reaktionsfähigkeit für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update und Neustart ausführen (`update.run`) mit Neustartbericht; anschließend nach der Wiederverbindung `update.status` pollen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Aufgabenbereich">
    - Bei isolierten Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können zu Keine wechseln, wenn Sie nur interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Hauptsitzungs-Jobs sind die Zustellungsmodi Webhook und Keine verfügbar.
    - Erweiterte Bearbeitungssteuerungen umfassen Nach Ausführung löschen, Agent-Überschreibung löschen, exakte Cron-/Versatzoptionen, Überschreibungen für Agent-Modell/Thinking sowie Umschalter für Best-Effort-Zustellung.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Legacy-Jobs mit `notify: true` von `cron.webhook` zu expliziter Webhook- oder Abschlusszustellung pro Job zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operator-Ansicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet MCP-Transporte nicht selbst; verwenden Sie sie, um gespeicherte Konfigurationen zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie einen Live-Nachweis des Servers benötigen.

Typischer Workflow:

1. Öffnen Sie **MCP** in der Seitenleiste.
2. Prüfen Sie die Zusammenfassungskarten für die Gesamtzahl sowie die Anzahl aktivierter, OAuth- und gefilterter Server.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierung, Authentifizierung, Filter, Timeouts und Befehlshinweise.
4. Schalten Sie die Aktivierung um, wenn ein Server konfiguriert bleiben, aber nicht in die Laufzeit-Erkennung aufgenommen werden soll.
5. Bearbeiten Sie den begrenzten Konfigurationsabschnitt `mcp` für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Tool-Filter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern & Veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, wenn der bearbeitete Prozess statische Diagnosen, Live-Nachweis oder das Verwerfen zwischengespeicherter Laufzeitdaten benötigt.

Die Seite schwärzt URL-ähnliche Werte mit Zugangsdaten vor dem Rendern und setzt Servernamen in Befehlsschnipseln in Anführungszeichen, damit kopierte Befehle auch mit Leerzeichen oder Shell-Metazeichen funktionieren. Die vollständige CLI- und Konfigurationsreferenz finden Sie unter [MCP](/de/cli/mcp).

## Aktivität-Tab

Der Aktivität-Tab ist ein flüchtiger, browserlokaler Beobachter für Live-Tool-Aktivität. Er wird aus demselben Gateway-Event-Stream `session.tool` / Tool abgeleitet, der die Chat-Tool-Karten speist; er fügt keine weitere Gateway-Event-Familie, keinen Endpunkt, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachter-Stream hinzu.

Aktivitätseinträge speichern nur bereinigte Zusammenfassungen und geschwärzte, gekürzte Ausgabevorschauen. Werte von Tool-Argumenten werden nicht im Aktivitätsstatus gespeichert; die UI zeigt an, dass Argumente ausgeblendet sind, und zeichnet nur die Anzahl der Argumentfelder auf. Die In-Memory-Liste folgt dem aktuellen Browser-Tab, bleibt bei Navigation innerhalb der Control UI erhalten und wird bei Seitenneuladen, Sitzungswechsel oder **Löschen** zurückgesetzt.

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Events gestreamt. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Timing-Metadaten für lokale Diagnosen erhalten.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Wenn eine sichtbare Assistant-Nachricht in `chat.history` gekürzt wurde, kann der Seitenleser den vollständigen, anzeigennormalisierten Transkripteintrag bei Bedarf über `chat.message.get` anhand von `sessionKey`, bei Bedarf aktiver `agentId`, und Transkript-`messageId` abrufen. Wenn der Gateway weiterhin nicht mehr zurückgeben kann, zeigt der Leser einen expliziten Nicht-verfügbar-Zustand an, statt die gekürzte Vorschau stillschweigend zu wiederholen.
    - Von Assistant generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Neuladevorgänge nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Chat-Verlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI nur für die Anzeige bestimmte Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-XML-Payloads von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendens und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Events sind Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Final-Events lädt die Control UI den Verlauf neu und führt nur ein kleines optimistisches Ende zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistant-Notiz an das Sitzungstranskript an und sendet ein `chat`-Event für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
    - Die Seitenleiste listet aktuelle Sitzungen mit einer Aktion Neue Sitzung, einem Link Alle Sitzungen und einer Sitzungssuchschaltfläche auf, die den vollständigen Sitzungsauswähler öffnet (auf den ausgewählten Agent begrenzt, mit Suche und Paginierung). Beim Wechseln von Agents werden nur Sitzungen angezeigt, die mit diesem Agent verknüpft sind, und es wird auf die Hauptsitzung dieses Agent zurückgegriffen, wenn er noch keine gespeicherten Dashboard-Sitzungen hat.
    - Auf Desktop-Breiten bleiben Chat-Steuerungen in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; beim Hochscrollen, Zurückkehren zum Anfang oder Erreichen des Endes werden die Steuerungen wiederhergestellt.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Sprechblase mit Zählabzeichen gerendert. Nachrichten, die Bilder, Anhänge, Tool-Ausgabe oder Canvas-Vorschauen enthalten, bleiben nicht zusammengeklappt.
    - Die Modell- und Thinking-Auswähler im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine reinen Sendeoptionen für eine einzelne Runde.
    - Wenn Sie eine Nachricht senden, während eine Modell-Auswahländerung für dieselbe Sitzung noch gespeichert wird, wartet der Composer auf diesen Sitzungspatch, bevor `chat.send` aufgerufen wird, damit der Versand das ausgewählte Modell verwendet.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe frische Dashboard-Sitzung wie Neuer Chat und wechselt zu ihr, außer wenn `session.dmScope: "main"` konfiguriert ist und das aktuelle übergeordnete Element die Hauptsitzung des Agent ist; in diesem Fall wird die Hauptsitzung an Ort und Stelle zurückgesetzt. Die Eingabe von `/reset` behält das explizite In-Place-Reset des Gateway für die aktuelle Sitzung bei.
    - Der Chat-Modellauswähler fordert die konfigurierte Modellansicht des Gateway an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist den Auswähler, einschließlich `provider/*`-Einträgen, die Provider-begrenzte Kataloge dynamisch halten. Andernfalls zeigt der Auswähler explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung an. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte aktuelle Kontext-Token enthalten, zeigt die Chat-Composer-Symbolleiste einen kleinen Kontextnutzungsring mit dem verwendeten Prozentsatz; die vollständigen Token-Details befinden sich im Tooltip. Der Ring wechselt bei hohem Kontextdruck zu Warn-Styling und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche an, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway erneut frische Nutzung meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus einem `openai`-API-Schlüssel-Auth-Profil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`; OpenAI-OAuth-Profile konfigurieren keine Echtzeit-Sprache. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen Standard-Provider-API-Schlüssel. OpenAI erhält ein flüchtiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig nutzbares, eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch den Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungs-Prompt wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Der Chat-Composer enthält neben der Start-/Stopp-Schaltfläche für Sprechen eine Schaltfläche für Sprechoptionen. Die Optionen gelten für die nächste Sprechsitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Präfix-Polsterung überschreiben. Wenn eine Option leer ist, verwendet der Gateway konfigurierte Standardwerte, sofern verfügbar, oder den Provider-Standard. Die Auswahl von Gateway-Relay erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung clientverwaltet und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browsersitzung erstellen kann.

    Im Chat-Composer ist die Sprechsteuerung die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Sprechen startet, zeigt die Composer-Statuszeile `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `talk.client.toolCall` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Einrichtung eines eingeschränkten Token-Browser-WebSockets und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und Abbrechen">
    - Klicken Sie auf **Stoppen** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steuern**, um diese Folgeanfrage in die laufende Runde einzuspeisen.
    - Geben Sie `/stop` ein (oder alleinstehende Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des Bandes abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Teilinhalten nach Abbruch">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden.
    - Der Gateway persistiert abgebrochenen teilweisen Assistant-Text in den Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten abgebrochene Teilinhalte von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einem OpenClaw-Update **Protocol mismatch** anzeigt, öffnen Sie zuerst das Dashboard mit `openclaw dashboard` erneut und führen Sie eine harte Aktualisierung der Seite aus. Wenn es weiterhin fehlschlägt, löschen Sie die Websitedaten für den Dashboard-Ursprung oder testen Sie in einem privaten Browserfenster; ein alter Tab oder Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle von vor dem Update gegen den neueren Gateway ausführen.

| Oberfläche                                           | Funktion                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                    | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-Zustandsverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                   | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel fest vorgeben möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `https://openclaw.ai`)

Die Control UI verwendet diese bereichsgeschützten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützte Push-Benachrichtigungen) und von der bestehenden Methode `push.test`, die auf natives Mobile-Pairing abzielen.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung in gehosteten Einbettungen.
  </Tab>
  <Tab title="scripts (default)">
    Erlaubt interaktive Einbettungen bei beibehaltener Ursprungsisolation; dies ist der Standard und reicht in der Regel für eigenständige Browserspiele/-Widgets aus.
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

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Drittanbieterseiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chatnachrichten

Gruppierte Chatnachrichten verwenden eine gut lesbare Standard-Maximalbreite. Deployments mit breiten Monitoren können sie ohne Patchen des gebündelten CSS überschreiben, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

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
  <Tab title="Integrated Tailscale Serve (preferred)">
    Behalten Sie den Gateway auf local loopback und lassen Sie Tailscale Serve ihn per HTTPS proxen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem die Adresse `x-forwarded-for` mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage local loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Für Control-UI-Operatorsitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Device-Pairing-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungsbereich serialisiert, bevor Rate-Limit-Schreibvorgänge erfolgen. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Mismatches parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, verlangen Sie Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
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

- Nur-Localhost-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` ist nur ein lokaler Kompatibilitätsschalter:

    - Er erlaubt Localhost-Control-UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht Localhost-)Verbindungen.

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsverschlechterung. Setzen Sie dies nach einem Notfalleinsatz schnell zurück.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Same-Host-Reverse-Proxys über local loopback erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Erlaubt sind nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal generierte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das praktisch bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin gerendert.
- Von Kanalmetadaten ausgegebene entfernte Avatar-URLs werden in den Avatar-Helfern der Control UI entfernt und durch das eingebaute Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe aus dem Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI denselben Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatarbild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route auf ansonsten geschützten Hosts Agentenidentität preisgibt.
- Die Control UI leitet beim Abrufen von Avataren den Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route unauthentifiziert, entsprechend dem Rest des Gateway.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet den Gateway-Token als Bearer-Header, wenn die Verfügbarkeit geprüft wird.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` statt des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Damit bleibt normales Medienrendering mit nativen Browser-Medienelementen kompatibel, ohne wiederverwendbare Gateway-Zugangsdaten in sichtbare Medien-URLs zu legen.

## UI erstellen

Der Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

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

## Leere Control-UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen nützlichen Fehler anzeigt, kann eine Erweiterung oder ein frühes Content Script verhindert haben, dass die JavaScript-Modul-App ausgewertet wird. Die statische Seite enthält ein einfaches HTML-Wiederherstellungspanel, das erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie die Aktion **Erneut versuchen** des Panels, nachdem Sie die Browserumgebung geändert haben, oder laden Sie nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die in alle Seiten injizieren, insbesondere Erweiterungen mit `<all_urls>`-Content-Scripts.
- Testen Sie ein privates Fenster, ein sauberes Browserprofil oder einen anderen Browser.
- Lassen Sie den Gateway laufen und verifizieren Sie nach der Browseränderung dieselbe Dashboard-URL.

## Debugging/Testen: Dev-Server + entfernter Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, der Gateway aber anderswo läuft.

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-kodieren Sie den Wert von `gatewayUrl`, damit der Browser den Query-String korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und Referern vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Credentials zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Credentials sind ein Fehler.
    - Verwenden Sie `wss://`, wenn der Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Control-UI-Bereitstellungen ohne loopback müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Origins). Private Same-Origin-Ladevorgänge in LAN/Tailnet von loopback, RFC1918/link-local, `.local`, `.ts.net` oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
    - Der Gateway-Start kann lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port initial eintragen, aber Remote-Browser-Origins benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jede Browser-Origin zu erlauben, nicht „den jeweils verwendeten Host abgleichen“.
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

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Integritätsprüfungen](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzerschnittstelle
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
