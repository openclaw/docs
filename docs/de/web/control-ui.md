---
read_when:
    - Sie möchten das Gateway über einen Browser betreiben
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Knoten, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-05-05T06:20:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`)

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

Das Dashboard-Einstellungsfenster speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Onboarding erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für Shared-Secret-Authentifizierung, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätepaarung (erste Verbindung)

Wenn Sie sich von einem neuen Browser oder Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Pairing-Genehmigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** "getrennt (1008): Pairing erforderlich"

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

Wenn der Browser das Pairing mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff umstellen, wird dies als Genehmigungs-Upgrade behandelt, nicht als stille Wiederverbindung. OpenClaw lässt die alte Genehmigung aktiv, blockiert die Wiederverbindung mit erweiterten Rechten und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn, Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Pairing-Roundtrip für Control UI-Bedienersitzungen überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität präsentiert.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID. Daher erfordern ein Browserwechsel oder das Löschen von Browserdaten ein erneutes Pairing.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine pro Browser festgelegte persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in geteilten Sitzungen hinzugefügt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig dauerhaft gespeichert, abgesehen von den normalen Metadaten zur Nachrichtenautorenschaft im Transkript für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und werden niemals per `config.patch` zurückgesendet. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Laufzeit-Konfigurationsendpunkt

Die Control UI ruft ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt ist durch dieselbe Gateway-Authentifizierung geschützt wie der Rest der HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/-Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um sie später zu überschreiben, öffnen Sie **Overview -> Gateway Access -> Language**. Die Locale-Auswahl befindet sich in der Gateway Access-Karte, nicht unter Appearance.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für denselben nicht englischen Locale-Satz erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thai (`th`) und persische (`fa`) Dokumentation werden weiterhin im Veröffentlichungs-Repository erzeugt; sie erscheinen möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Erscheinungsbild-Themes

Das Appearance-Fenster behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importslot. Um ein Theme zu importieren, öffnen Sie den [tweakcn editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Share** und fügen Sie den kopierten Theme-Link in Appearance ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Leeren dieses Slots wechselt das aktive Theme zurück zu Claw, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Einmal-Browsertoken über WebSocket, und rein backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.realtime.relay*`-RPCs streamt und `openclaw_agent_consult`-Toolaufrufe über `chat.send` an das größere konfigurierte OpenClaw-Modell zurücksendet.
    - Streamen Sie Toolaufrufe und Live-Toolausgabe-Karten im Chat (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Dreams">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Instanzen: Präsenzliste und Aktualisierung (`system-presence`).
    - Sitzungen: Liste und sitzungsbezogene Überschreibungen für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: Dreaming-Status, Aktivieren-/Deaktivieren-Umschalter und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: Liste und Caps (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists und Abfragerichtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Mit Validierung anwenden und neu starten (`config.apply`) und die zuletzt aktive Sitzung wecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben paralleler Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen aktive SecretRef-Auflösung für Referenzen in der übermittelten Konfigurations-Payload vorab; nicht auflösbare aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, Zusammenfassungen unmittelbarer Kindelemente, Dokumentationsmetadaten zu verschachtelten Objekt-/Wildcard-/Array-/Kompositions-Nodes sowie Plugin- und Kanal-Schemata, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher per Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - Im Raw-JSON-Editor bewahrt „Auf Gespeichertes zurücksetzen“ die roh erstellte Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen einen Reset überstehen, wenn der Snapshot sicher per Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um versehentliche Objekt-zu-String-Beschädigung zu verhindern.

  </Accordion>
  <Accordion title="Debug, Protokolle, Update">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Control UI-Aktualisierungs-/RPC-Zeiten sowie Einträge zur Browserreaktionsfähigkeit für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Protokolle: Live-Tail der Gateway-Dateiprotokolle mit Filter/Export (`logs.tail`).
    - Update: Ein Paket-/Git-Update ausführen und neu starten (`update.run`) mit einem Neustartbericht; anschließend nach der Wiederverbindung `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Fenster">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können zu „keine“ wechseln, wenn Sie rein interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigung ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
    - Für Hauptsitzungs-Jobs sind die Zustellmodi Webhook und „keine“ verfügbar.
    - Erweiterte Bearbeitungssteuerungen umfassen Nach-Ausführung-löschen, Agent-Überschreibung löschen, exakte/gestaffelte Cron-Optionen, Agent-Modell-/Thinking-Überschreibungen und Best-Effort-Zustellungsumschalter.
    - Formularvalidierung erfolgt inline mit feldbezogenen Fehlern; ungültige Werte deaktivieren den Speicherbutton, bis sie behoben sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Authentifizierungsheader gesendet.
    - Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert sind.

  </Accordion>
</AccordionGroup>

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
    - `chat.history`-Antworten sind aus UI-Sicherheitsgründen größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Vom Assistant generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass Neuladevorgänge nicht davon abhängen, dass rohe Base64-Bild-Payloads in der Chat-Verlaufsantwort verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI nur zur Anzeige bestimmte Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Payloads von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modell-Steuerungstokens und lässt Assistant-Einträge aus, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` oder das Heartbeat-Bestätigungstoken `HEARTBEAT_OK` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse sind der Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach abschließenden Tool-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Rest zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistant-Notiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agent-Filter vor der Sitzungsauswahl, und die Sitzungsauswahl ist auf den ausgewählten Agent beschränkt. Beim Wechseln des Agents werden nur Sitzungen angezeigt, die mit diesem Agent verknüpft sind, und es wird auf die Hauptsitzung dieses Agents zurückgegriffen, wenn er noch keine gespeicherten Dashboard-Sitzungen hat.
    - Bei Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Scrollen im Transkript nach unten eingeklappt; Scrollen nach oben, Zurückkehren zum Anfang oder Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Blase mit Zählabzeichen dargestellt. Nachrichten mit Bildern, Anhängen, Tool-Ausgabe oder Canvas-Vorschauen bleiben nicht eingeklappt.
    - Die Modell- und Thinking-Auswahl im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine Sendeoptionen nur für eine einzelne Runde.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe neue Dashboard-Sitzung wie New Chat und wechselt dorthin. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge plus Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte hohen Kontextdruck anzeigen, zeigt der Chat-Composer-Bereich einen Kontexthinweis und bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzungspfad für Compaction ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway wieder frische Nutzung meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder konfigurieren Sie Google mit `talk.provider: "google"` plus `talk.providers.google.apiKey`; die Echtzeit-Provider-Konfiguration für Voice Call kann weiterhin als Fallback wiederverwendet werden. Der Browser erhält niemals einen Standard-Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig nutzbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Anmeldedaten und Anbieter-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungs-Prompt wird vom Gateway zusammengesetzt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf über `chat.send` das konfigurierte größere Modell konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` überprüft den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Einrichtung eines eingeschränkten Tokens für Browser-WebSocket und den Gateway-Relay-Browser-Adapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Geheimnisse.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Nachfragen in die Warteschlange gestellt. Klicken Sie bei einer eingereihten Nachricht auf **Steer**, um diese Nachfrage in die laufende Runde einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchformulierungen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des normalen Bands abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Abbruch-Teilergebnissen">
    - Wenn ein Lauf abgebrochen wird, kann teilweiser Assistant-Text weiterhin in der UI angezeigt werden.
    - Der Gateway persistiert abgebrochenen teilweisen Assistant-Text im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten Abbruch-Teilergebnisse von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Mit Web Push kann der Gateway die installierte PWA per Benachrichtigung wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                             | Was sie tut                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                       | PWA-Manifest. Browser bieten „Install app“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                      | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-Statusverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                     | Persistierte Browser-Abonnement-Endpunkte.                         |

Überschreiben Sie das VAPID-Schlüsselpaar über Env-Variablen im Gateway-Prozess, wenn Sie Schlüssel fest vorgeben möchten (für Multi-Host-Bereitstellungen, Geheimnisrotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standard ist `mailto:openclaw@localhost`)

Die Control UI verwendet diese scope-gesteuerten Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützten Push) und von der bestehenden Methode `push.test`, die auf native Mobile-Kopplung abzielt.
</Note>

## Gehostete Einbettungen

Assistant-Nachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen bei beibehaltener Origin-Isolation; dies ist der Standard und reicht normalerweise für eigenständige Browser-Spiele/-Widgets aus.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten agent-generierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Drittanbieterseiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chat-Nachrichten

Gruppierte Chat-Nachrichten verwenden eine gut lesbare Standard-Maximalbreite. Bereitstellungen mit breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

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
    Belassen Sie den Gateway auf loopback und lassen Sie Tailscale Serve ihn mit HTTPS proxyn:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw überprüft die Identität, indem die Adresse `x-forwarded-for` mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Für Control-UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Geräte-Kopplungs-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie explizite Shared-Secret-Anmeldedaten auch für Serve-Traffic verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungs-Scope serialisiert, bevor Rate-Limit-Schreibvorgänge erfolgen. Gleichzeitige fehlgeschlagene Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host laufen kann, verlangen Sie Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Fügen Sie das passende gemeinsame Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsabsenkung. Machen Sie diese Einstellung nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu vertrauenswürdigem Proxy">
    - Erfolgreiche trusted-proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies erstreckt sich **nicht** auf Control-UI-Sitzungen mit Node-Rolle.
    - Reverse-Proxys mit loopback auf demselben Host erfüllen trusted-proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Es sind nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal generierte `blob:`-URLs erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkanfragen aus.

Das bedeutet in der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Nutzdaten im Protokoll).
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Kanalmetadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten; es ist immer aktiv und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der benachbarten assistant-media-Route). Dadurch wird verhindert, dass die Avatar-Route die Agent-Identität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet das Gateway-Token beim Abrufen von Avataren als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem Rest des Gateway.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistants eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet das Gateway-Token beim Prüfen der Verfügbarkeit als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Dadurch bleibt normales Medien-Rendering mit nativen Medien-Elementen des Browsers kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbare Medien-URLs einzufügen.

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

## Debugging/Testing: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal nutzen möchten, das Gateway aber an anderer Stelle läuft.

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
    - Wenn Sie einen vollständigen `ws://`- oder `wss://`-Endpunkt über `gatewayUrl` übergeben, URL-codieren Sie den `gatewayUrl`-Wert, damit der Browser die Query-Zeichenkette korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Request-Logs und Referer vermieden werden. Legacy-`?token=`-Query-Parameter werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Speicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Anmeldedaten aus Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-loopback-Control-UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Ursprünge). Dazu gehören entfernte Dev-Setups.
    - Der Gateway-Start kann lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port vorbefüllen, entfernte Browser-Ursprünge benötigen jedoch weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zu erlauben, nicht „beliebigen Host, den ich gerade verwende, abgleichen“.
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

Details zur Einrichtung des Fernzugriffs: [Remote-Zugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Integritätsprüfungen](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
