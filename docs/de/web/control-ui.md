---
read_when:
    - Sie möchten den Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für den Gateway (Chat, Aktivität, Knoten, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-07-02T00:51:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn der Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst den Gateway: `openclaw gateway`.

<Note>
Bei nativen Windows-LAN-Bindungen können Windows Firewall oder per Organisation verwaltete Gruppenrichtlinien die beworbene LAN-URL weiterhin blockieren, selbst wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, Profilabweichungen und lokale Firewall-Regeln, die von Richtlinien möglicherweise ignoriert werden.
</Note>

Auth wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungen-Panel des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Onboarding erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für Shared-Secret-Auth, aber Passwort-Auth funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät aus mit der Control UI verbinden, verlangt der Gateway normalerweise eine **einmalige Kopplungsgenehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** „disconnected (1008): Kopplung erforderlich“

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

Wenn der Browser die Kopplung mit geänderten Auth-Details (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Admin-Zugriff ändern, wird dies als Genehmigungs-Upgrade behandelt, nicht als stille Neuverbindung. OpenClaw hält die alte Genehmigung aktiv, blockiert die breitere Neuverbindung und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie sie nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

Paperclip-Agenten, die über den `openclaw_gateway`-Adapter verbinden, verwenden denselben Genehmigungsfluss beim ersten Start. Führen Sie nach dem ersten Verbindungsversuch `openclaw devices approve --latest` aus, um die ausstehende Anfrage anzuzeigen, und führen Sie dann den ausgegebenen Befehl `openclaw devices approve <requestId>` erneut aus, um sie zu genehmigen. Übergeben Sie für einen Remote-Gateway explizite Werte für `--url` und `--token`. Damit Genehmigungen über Neustarts hinweg stabil bleiben, konfigurieren Sie in Paperclip ein persistentes `adapterConfig.devicePrivateKeyPem`, anstatt bei jedem Lauf eine neue flüchtige Geräteidentität erzeugen zu lassen.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Kopplungs-Roundtrip für Control-UI-Operator-Sitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID; daher erfordert der Wechsel des Browsers oder das Löschen von Browserdaten eine erneute Kopplung.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsamen Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird nicht mit anderen Geräten synchronisiert oder serverseitig dauerhaft gespeichert, abgesehen von den normalen Transcript-Autor-Metadaten für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder der Wechsel des Browsers setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und werden niemals über `config.patch` zurückgesendet. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Runtime-Einstellungen von `/control-ui-config.json` ab, relativ zum Control-UI-Basispfad des Gateways aufgelöst (zum Beispiel `/__openclaw__/control-ui-config.json`, wenn die UI unter `/__openclaw__/` bereitgestellt wird). Dieser Endpunkt wird durch dieselbe Gateway-Auth geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale-Serve-Identität oder eine Identität eines vertrauenswürdigen Proxys.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um sie später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Die Locale-Auswahl befindet sich in der Gateway-Access-Karte, nicht unter Appearance.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für dieselbe nicht englische Locale-Menge erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationssite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Publish-Repo erzeugt; sie erscheint möglicherweise erst dann in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Erscheinungsbild-Themes

Das Appearance-Panel behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Import-Slot. Um ein Theme zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Share** und fügen Sie den kopierten Theme-Link in Appearance ein. Der Importer akzeptiert auch `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade `/themes/<id>`, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Appearance enthält außerdem eine browserlokale Einstellung für die Textgröße. Die Einstellung wird mit den übrigen Control-UI-Einstellungen gespeichert, gilt für Chat-Text, Composer-Text, Tool-Karten und Chat-Seitenleisten und hält Texteingaben bei mindestens 16px, damit mobiles Safari beim Fokussieren nicht automatisch zoomt.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen schaltet das aktive Theme zurück auf Claw, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Chatverlaufsaktualisierungen fordern ein begrenztes aktuelles Fenster mit Textobergrenzen pro Nachricht an, damit große Sitzungen den Browser nicht dazu zwingen, eine vollständige Transcript-Nutzlast zu rendern, bevor der Chat nutzbar wird.
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmaliges Browser-Token über WebSocket, und nur backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Client-eigene Provider-Sitzungen starten mit `talk.client.create`; Gateway-Relay-Sitzungen starten mit `talk.session.create`. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, `openclaw_agent_consult`-Provider-Tool-Aufrufe über `talk.client.toolCall` für Gateway-Richtlinie und das größere konfigurierte OpenClaw-Modell weiterleitet und Sprachsteuerung für aktive Runs über `talk.client.steer` oder `talk.session.steer` routet.
    - Streamen Sie Tool-Aufrufe und Live-Tool-Ausgabekarten im Chat (Agent-Ereignisse).
    - Activity-Tab mit browserlokalen, redaktionsorientierten Zusammenfassungen der Live-Tool-Aktivität aus vorhandener `session.tool`- / Tool-Ereigniszustellung.

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: Status für integrierte sowie gebündelte/externe Plugin-Kanäle, QR-Login und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Aktualisierungen von Kanal-Probes halten den vorherigen Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden, und Teil-Snapshots werden gekennzeichnet, wenn eine Probe oder ein Audit ihr UI-Budget überschreitet.
    - Instanzen: Präsenzliste und Aktualisierung (`system-presence`).
    - Sitzungen: Standardmäßig Sitzungen konfigurierter Agenten auflisten, von veralteten Sitzungsschlüsseln nicht konfigurierter Agenten zurückfallen und modell-/thinking-/fast-/verbose-/trace-/reasoning-Overrides pro Sitzung anwenden (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Aktivieren-/Deaktivieren-Umschalter und Dream-Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Knoten, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Run-Verlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüsselaktualisierungen (`skills.*`).
    - Knoten: Liste und Caps (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Knoten-Allowlists bearbeiten und Ask-Richtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - MCP hat eine eigene Einstellungsseite für konfigurierte Server, Aktivierung, OAuth-/Filter-/Parallelzusammenfassungen, häufige Operatorbefehle und den scoped `mcp`-Konfigurationseditor.
    - Mit Validierung anwenden und neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben paralleler Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen die aktive SecretRef-Auflösung für Refs in der eingereichten Konfigurationsnutzlast vorab; nicht aufgelöste aktive eingereichte Refs werden vor dem Schreiben abgelehnt.
    - Form-Speicherungen verwerfen veraltete redigierte Platzhalter, die nicht aus der gespeicherten Konfiguration wiederhergestellt werden können, während redigierte Werte erhalten bleiben, die weiterhin gespeicherten Secrets zugeordnet sind.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, unmittelbarer untergeordneter Zusammenfassungen, Docs-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- und Kanalschemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher roundtrippen kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Reset to saved“ im Raw-JSON-Editor bewahrt die roh erstellte Form (Formatierung, Kommentare, `$include`-Layout), anstatt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher roundtrippen kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um versehentliche Objekt-zu-String-Beschädigung zu verhindern.

  </Accordion>
  <Accordion title="Debug, Logs, Update">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control-UI-Aktualisierungs-/RPC-Timings, langsame Chat-/Konfigurations-Render-Timings und Einträge zur Browser-Reaktionsfähigkeit für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update und Neustart ausführen (`update.run`) mit Neustartbericht, dann nach der Neuverbindung `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Job-Panel">
    - Bei isolierten Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf keine umstellen, wenn Sie rein interne Ausführungen möchten.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, das auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Jobs in der Hauptsitzung sind die Zustellmodi Webhook und keine verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Löschen nach Ausführung, Agent-Override löschen, exakte/versetzte Cron-Optionen, Overrides für Agent-Modell/Thinking und Umschalter für Best-Effort-Zustellung.
    - Die Formularvalidierung erfolgt inline mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es ausgelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Legacy-Jobs mit `notify: true` von `cron.webhook` zu expliziter Webhook- oder Abschlusszustellung pro Job zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operatoransicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet keine MCP-Transporte selbst; verwenden Sie sie, um gespeicherte Konfiguration zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie Live-Server-Nachweise benötigen.

Typischer Workflow:

1. Öffnen Sie **MCP** über die Seitenleiste.
2. Prüfen Sie die Übersichtskarten für die Anzahl aller, aktivierter, OAuth- und gefilterter Server.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierung, Authentifizierung, Filter, Timeouts und Befehlshinweise.
4. Schalten Sie die Aktivierung um, wenn ein Server konfiguriert bleiben, aber aus der Laufzeiterkennung herausgehalten werden soll.
5. Bearbeiten Sie den begrenzten Konfigurationsabschnitt `mcp` für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Tool-Filter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern & Veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, wenn der bearbeitete Prozess statische Diagnosen, Live-Nachweise oder das Verwerfen zwischengespeicherter Laufzeitdaten benötigt.

Die Seite schwärzt URL-ähnliche Werte mit Zugangsdaten vor dem Rendern und setzt Servernamen in Befehlssnippets in Anführungszeichen, damit kopierte Befehle auch mit Leerzeichen oder Shell-Metazeichen funktionieren. Die vollständige CLI- und Konfigurationsreferenz finden Sie unter [MCP](/de/cli/mcp).

## Tab „Aktivität“

Der Tab „Aktivität“ ist ein flüchtiger, browserlokaler Beobachter für Live-Tool-Aktivität. Er wird aus demselben Gateway-Event-Stream `session.tool` / Tool abgeleitet, der Chat-Tool-Karten antreibt; er fügt keine weitere Gateway-Event-Familie, keinen Endpoint, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachter-Stream hinzu.

Aktivitätseinträge behalten nur bereinigte Zusammenfassungen und geschwärzte, gekürzte Ausgabevorschauen. Tool-Argumentwerte werden nicht im Aktivitätszustand gespeichert; die UI zeigt an, dass Argumente ausgeblendet sind, und erfasst nur die Anzahl der Argumentfelder. Die In-Memory-Liste folgt dem aktuellen Browser-Tab, übersteht Navigation innerhalb der Control UI und wird beim Neuladen der Seite, beim Sitzungswechsel oder mit **Löschen** zurückgesetzt.

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort streamt über `chat`-Events. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Timing-Metadaten für lokale Diagnosen erhalten.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Wenn eine sichtbare Assistant-Nachricht in `chat.history` gekürzt wurde, kann der Seitenleser den vollständigen, anzeige-normalisierten Transkripteintrag bei Bedarf über `chat.message.get` anhand von `sessionKey`, aktivem `agentId` bei Bedarf und Transkript-`messageId` abrufen. Wenn der Gateway weiterhin nicht mehr zurückgeben kann, zeigt der Leser einen expliziten Nicht-verfügbar-Zustand an, statt stillschweigend die gekürzte Vorschau zu wiederholen.
    - Assistant-/generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs wieder ausgeliefert, sodass Neuladevorgänge nicht davon abhängen, dass rohe base64-Bildpayloads in der Chat-Verlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI reine Anzeige-Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Plain-Text-Tool-Call-XML-Payloads (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/vollbreite Modell-Steuerungstoken und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur das exakte Silent-Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Events sind Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach Tool-Final-Events lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistant-Notiz an das Sitzungstranskript an und sendet ein `chat`-Event für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agent-Filter vor dem Sitzungsauswähler, und der Sitzungsauswähler ist auf den ausgewählten Agent begrenzt. Beim Wechseln von Agents werden nur Sitzungen angezeigt, die mit diesem Agent verknüpft sind, und es wird auf die Hauptsitzung dieses Agents zurückgegriffen, wenn noch keine gespeicherten Dashboard-Sitzungen vorhanden sind.
    - Bei Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; Hochscrollen, Rückkehr zum Anfang oder Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Bubble mit Zähl-Badge gerendert. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht zusammengeklappt.
    - Die Modell- und Thinking-Auswähler im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungs-Overrides, keine Sendeoptionen nur für einen Turn.
    - Wenn Sie eine Nachricht senden, während eine Modell-Auswahländerung für dieselbe Sitzung noch gespeichert wird, wartet der Composer auf diesen Sitzungspatch, bevor er `chat.send` aufruft, damit der Sendevorgang das ausgewählte Modell verwendet.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe frische Dashboard-Sitzung wie Neuer Chat und wechselt zu ihr, außer wenn `session.dmScope: "main"` konfiguriert ist und das aktuelle übergeordnete Element die Hauptsitzung des Agents ist; in diesem Fall wird die Hauptsitzung direkt zurückgesetzt. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateway für die aktuelle Sitzung bei.
    - Der Chat-Modellauswähler fordert die konfigurierte Modellansicht des Gateway an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist den Auswähler, einschließlich `provider/*`-Einträgen, die Provider-begrenzte Kataloge dynamisch halten. Andernfalls zeigt der Auswähler explizite `models.providers.*.models`-Einträge plus Provider mit nutzbarer Authentifizierung an. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte aktuelle Kontext-Token enthalten, zeigt der Chat-Composer-Bereich einen kompakten Kontextnutzungsindikator. Er wechselt bei hohem Kontextdruck zu Warnstyling und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway wieder frische Nutzungsdaten meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Voice-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` plus einem `openai`-API-Key-Auth-Profil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`; OpenAI-OAuth-Profile konfigurieren keine Realtime-Voice. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Der Browser erhält nie einen Standard-Provider-API-Key. OpenAI erhält ein flüchtiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch den Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs läuft. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Instruktions-Overrides.

    Der Chat-Composer enthält neben der Talk-Start-/Stopp-Schaltfläche eine Talk-Optionen-Schaltfläche. Die Optionen gelten für die nächste Talk-Sitzung und können Provider, Transport, Modell, Stimme, Reasoning-Aufwand, VAD-Schwellenwert, Stilledauer und Präfix-Padding überschreiben. Wenn eine Option leer ist, verwendet der Gateway konfigurierte Standardwerte, sofern verfügbar, oder den Provider-Standard. Die Auswahl von Gateway-Relay erzwingt den Backend-Relay-Pfad; die Auswahl von WebRTC hält die Sitzung clientseitig und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browser-Sitzung erstellen kann.

    Im Chat-Composer ist das Talk-Steuerelement die Waves-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Realtime-Tool-Call das konfigurierte größere Modell über `talk.client.toolCall` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung von Google Live mit eingeschränktem Token für Browser-WebSocket und den Gateway-Relay-Browser-Adapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und Abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen eingereiht. Klicken Sie bei einer eingereihten Nachricht auf **Steer**, um diese Folgeanfrage in den laufenden Turn einzuschleusen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Teilinhalten nach Abbruch">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden.
    - Gateway persistiert abgebrochenen teilweisen Assistant-Text in der Transkript-Historie, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten Abbruch-Teilinhalte von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einem OpenClaw-Update **Protocol mismatch** anzeigt, öffnen Sie zuerst das Dashboard mit `openclaw dashboard` erneut und laden Sie die Seite hart neu. Wenn es weiterhin fehlschlägt, löschen Sie die Websitedaten für den Dashboard-Ursprung oder testen Sie in einem privaten Browserfenster; ein alter Tab oder ein Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle von vor dem Update gegen den neueren Gateway ausführen.

| Oberfläche                                           | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-Statusverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel festlegen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `https://openclaw.ai`)

Die Control UI verwendet diese Scope-geschützten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für Relay-gestützte Push-Benachrichtigungen) und von der vorhandenen Methode `push.test`, die auf natives Mobile-Pairing abzielt.
</Note>

## Gehostete Einbettungen

Assistant-Nachrichten können gehostete Webinhalte inline mit dem `[embed ...]`-Shortcode rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (default)">
    Erlaubt interaktive Einbettungen, während die Origin-Isolation erhalten bleibt; dies ist der Standard und reicht normalerweise für eigenständige Browserspiele/Widgets aus.
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

Gruppierte Chat-Nachrichten verwenden eine gut lesbare Standard-Maximalbreite. Deployments mit breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

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
    Belassen Sie das Gateway auf loopback und lassen Sie es von Tailscale Serve per HTTPS proxyn:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können sich Control UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem es die `x-forwarded-for`-Adresse mit `tailscale whois` auflöst und sie mit dem Header abgleicht; akzeptiert wird dies nur, wenn die Anfrage loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Geräte-Pairing-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Traffic explizite Shared-Secret-Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können deshalb bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, verlangen Sie Token-/Passwort-Authentifizierung.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie anschließend:

    - `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur-Localhost-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass-Option `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - Er erlaubt Localhost-Control UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht-Localhost-)Verbindungen.

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
    `dangerouslyDisableDeviceAuth` deaktiviert Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsabsenkung. Machen Sie dies nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control UI-Sitzungen mit Node-Rolle.
    - Same-Host-loopback-Reverse-Proxys erfüllen Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Erlaubt sind nur Assets mit **same-origin**, `data:`-URLs und lokal generierte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgewiesen und lösen keine Netzwerkabrufe aus.

Was das praktisch bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Lokale `blob:`-URLs, die von der Control UI erstellt wurden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Channel-Metadaten ausgegeben werden, werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Channel keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiv und nicht konfigurierbar.

## Avatar-Routen-Authentifizierung

Wenn Gateway-Authentifizierung konfiguriert ist, verlangt der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten unter derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgewiesen (entsprechend der benachbarten Assistant-Media-Route). Dies verhindert, dass die Avatar-Route Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem restlichen Gateway.

## Assistant-Media-Routen-Authentifizierung

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistant eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Control UI-Operator-Authentifizierung. Der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` statt des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt normales Medien-Rendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Zugangsdaten in sichtbare Medien-URLs zu setzen.

## UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionaler absoluter Basis-Pfad (wenn Sie feste Asset-URLs möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Richten Sie die UI anschließend auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Leere Control UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen hilfreichen Fehler zeigt, kann eine Erweiterung oder ein frühes Content-Skript verhindert haben, dass die JavaScript-Modul-App ausgewertet wird. Die statische Seite enthält ein einfaches HTML-Wiederherstellungspanel, das erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie die Aktion **Erneut versuchen** des Panels, nachdem Sie die Browserumgebung geändert haben, oder laden Sie nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die in alle Seiten injizieren, insbesondere Erweiterungen mit `<all_urls>`-Content-Skripten.
- Versuchen Sie ein privates Fenster, ein sauberes Browserprofil oder einen anderen Browser.
- Lassen Sie das Gateway laufen und überprüfen Sie nach der Browseränderung dieselbe Dashboard-URL.

## Debugging/Testen: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal nutzen möchten, das Gateway aber anderswo läuft.

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
  <Accordion title="Hinweise">
    - `gatewayUrl` wird nach dem Laden in localStorage gespeichert und aus der URL entfernt.
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-codieren Sie den Wert `gatewayUrl`, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte, wann immer möglich, über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und im Referer vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, jedoch nur als Fallback, und direkt nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn der Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Control-UI-Bereitstellungen ohne Loopback müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Origins). Private Same-Origin-LAN-/Tailnet-Ladevorgänge von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
    - Der Gateway-Start kann lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port setzen, aber entfernte Browser-Origins benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jede Browser-Origin zuzulassen, nicht „den Host abgleichen, den ich gerade verwende“.
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

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Zustandsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
