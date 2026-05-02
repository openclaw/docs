---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungs-UI für das Gateway (Chat, Nodes, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-05-02T23:39:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50bef807915f27406e19f1c6ca7d839a610d79ba79da85d7a78523400cbf9208
    source_path: web/control-ui.md
    workflow: 16
---

Die Steuerungsoberfläche ist eine kleine **Vite + Lit** Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfenster des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Das Onboarding erzeugt beim ersten Verbinden normalerweise ein Gateway-Token für Shared-Secret-Authentifizierung, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie die Steuerungsoberfläche von einem neuen Browser oder Gerät aus verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsbestätigung**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen:** "getrennt (1008): Kopplung erforderlich"

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Berechtigungsumfänge/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff umstellen, wird dies als Genehmigungsupgrade behandelt, nicht als stillschweigende erneute Verbindung. OpenClaw hält die alte Genehmigung aktiv, blockiert die umfassendere erneute Verbindung und fordert Sie auf, den neuen Umfangssatz explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, es sei denn, Sie widerrufen es mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte Browserverbindungen über local loopback (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann den Kopplungsdurchlauf für Operator-Sitzungen der Steuerungsoberfläche überspringen, wenn `gateway.auth.allowTailscale: true` gesetzt ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine explizite Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordert ein Browserwechsel oder das Löschen von Browserdaten eine erneute Kopplung.

</Note>

## Persönliche Identität (browserlokal)

Die Steuerungsoberfläche unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in geteilten Sitzungen angehängt wird. Sie befindet sich im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normalen Autor-Metadaten des Transkripts für Nachrichten hinaus gespeichert, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Avatar-Überschreibung des Assistenten. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und durchlaufen niemals `config.patch`. Das geteilte Konfigurationsfeld `ui.assistant.avatar` bleibt weiterhin für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. skriptgesteuerte Gateways oder benutzerdefinierte Dashboards).

## Laufzeitkonfigurations-Endpunkt

Die Steuerungsoberfläche ruft ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung geschützt wie die restliche HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Steuerungsoberfläche kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Gateway-Zugriff-Karte, nicht unter Darstellung.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser bei Bedarf geladen.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für dieselbe nicht englische Locale-Menge erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repository erzeugt; sie erscheint möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemen

Das Darstellungsfenster behält die integrierten Designs Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importplatz. Um ein Design zu importieren, öffnen Sie [tweakcn-Designs](https://tweakcn.com/themes), wählen oder erstellen Sie ein Design, klicken Sie auf **Teilen**, und fügen Sie den kopierten Designlink in Darstellung ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, reine Design-IDs und Standard-Designnamen wie `amethyst-haze`.

Importierte Designs werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Designs aktualisiert den einen lokalen Platz; das Löschen schaltet das aktive Design zurück auf Claw, wenn das importierte Design ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Sprechen">
    - Mit dem Modell über Gateway WS chatten (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - In den Chat-Composer mit serverseitiger STT diktieren (`chat.transcribeAudio`). Der Browser zeichnet einen kurzen Mikrofonclip auf und sendet ihn an das Gateway, das die konfigurierte `tools.media.audio`-Transkriptionspipeline ausführt und Entwurfstext zurückgibt, ohne Provider-Anmeldedaten im Browser offenzulegen.
    - Über Browser-Echtzeitsitzungen sprechen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmalig nutzbares Browser-Token über WebSocket, und nur backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.realtime.relay*`-RPCs streamt und `openclaw_agent_consult`-Toolaufrufe über `chat.send` an das größere konfigurierte OpenClaw-Modell zurücksendet.
    - Toolaufrufe und Live-Toolausgabe-Karten im Chat streamen (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: integrierter Status plus Status gebündelter/externer Plugin-Kanäle, QR-Anmeldung und Konfiguration pro Kanal (`channels.status`, `web.login.*`, `config.patch`).
    - Instanzen: Anwesenheitsliste und Aktualisierung (`system-presence`).
    - Sitzungen: Liste und sitzungsbezogene Überschreibungen für Modell/Denken/schnell/ausführlich/Trace/Reasoning (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Dream-Diary-Leser (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Ausführungshistorie (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: Liste und Fähigkeiten (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists bearbeiten und Abfragerichtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Anwenden und Neustart mit Validierung (`config.apply`) sowie Aufwecken der zuletzt aktiven Sitzung.
    - Schreibvorgänge enthalten einen Basis-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Referenzen in der übermittelten Konfigurationsnutzlast; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, unmittelbarer Kindzusammenfassungen, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositions-Nodes sowie Plugin- und Kanalschemata, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot eine sichere Raw-Roundtrip-Verarbeitung hat.
    - Wenn ein Snapshot Rohtext nicht sicher im Roundtrip verarbeiten kann, erzwingt die Steuerungsoberfläche den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - Der Raw-JSON-Editor „Auf gespeicherten Stand zurücksetzen“ bewahrt die raw-verfasste Form (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher im Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt dargestellt, um versehentliche Beschädigung durch Umwandlung von Objekt zu String zu verhindern.

  </Accordion>
  <Accordion title="Debug, Protokolle, Aktualisierung">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Protokolle: Live-Tail der Gateway-Dateiprotokolle mit Filter/Export (`logs.tail`).
    - Aktualisierung: Paket-/Git-Aktualisierung und Neustart ausführen (`update.run`) mit Neustartbericht, anschließend nach der erneuten Verbindung `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Fenster">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf keine umschalten, wenn Sie nur interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
    - Für Hauptsitzungs-Jobs sind die Zustellmodi Webhook und keine verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Nach-Ausführung-löschen, Agent-Überschreibung löschen, Cron-Optionen exakt/gestaffelt, Überschreibungen für Agent-Modell/Denken und Best-Effort-Zustellumschalter.
    - Die Formularvalidierung erfolgt inline mit feldbezogenen Fehlern; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn ausgelassen, wird der Webhook ohne Authentifizierungsheader gesendet.
    - Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können weiterhin `cron.webhook` verwenden, bis sie migriert wurden.

  </Accordion>
</AccordionGroup>

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt.
    - `chat.transcribeAudio` ist ein einmaliger Diktierhelfer für Chat-Entwürfe. Er akzeptiert im Browser aufgezeichnetes Base64-Audio, hält Uploads unterhalb des Gateway-WebSocket-Frame-Limits, schreibt eine temporäre lokale Datei, führt Audio-Transkription mit Medienverständnis und der aktiven Gateway-Konfiguration aus, gibt `{ text, provider, model }` zurück und entfernt die temporäre Datei. Er erstellt keinen Agentenlauf und ist von Echtzeit-Talk getrennt.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind zur UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Vom Assistenten generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs wieder ausgeliefert, sodass Neuladen nicht davon abhängt, dass rohe Base64-Bilddaten in der Chat-Verlaufsantwort verbleiben.
    - `chat.history` entfernt außerdem nur für die Anzeige bestimmte Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII- und vollbreite Modell-Steuertoken und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer- und Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agentenlauf, keine Kanalzustellung).
    - Die Modell- und Thinking-Auswahlen im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine nur für einen einzelnen Turn geltenden Sendeoptionen.
    - Die Eingabe von `/new` in der Control UI erstellt und wechselt zu derselben frischen Dashboard-Sitzung wie New Chat. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte hohen Kontextdruck anzeigen, zeigt der Chat-Composer-Bereich einen Kontexthinweis und bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis das Gateway erneut frische Nutzung meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder konfigurieren Sie Google mit `talk.provider: "google"` plus `talk.providers.google.apiKey`; die Echtzeit-Provider-Konfiguration für Voice Call kann weiterhin als Fallback wiederverwendet werden. Der Browser erhält niemals einen standardmäßigen Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig nutzbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch das Gateway im Token gesperrt sind. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, dann `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `chat.send` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` überprüft den OpenAI-Browser-WebRTC-SDP-Austausch, die Google-Live-Browser-WebSocket-Einrichtung mit eingeschränktem Token und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steer**, um diese Folgeanfrage in den laufenden Turn einzuschleusen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des normalen Pfads abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung abgebrochener Teilausgaben">
    - Wenn ein Lauf abgebrochen wird, kann partieller Assistententext weiterhin in der UI angezeigt werden.
    - Das Gateway persistiert abgebrochenen partiellen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten abgebrochene Teilausgaben von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-Statusverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzdaten. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Abonnement-Endpunkte.                         |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen im Gateway-Prozess, wenn Sie Schlüssel festlegen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `mailto:openclaw@localhost`)

Die Control UI verwendet diese scope-gebundenen Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützte Push-Benachrichtigungen) und von der bestehenden Methode `push.test`, die auf native mobile Kopplung abzielt.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen bei gleichzeitiger Origin-Isolation; dies ist die Standardeinstellung und reicht normalerweise für eigenständige Browser-Spiele/Widgets aus.
  </Tab>
  <Tab title="trusted">
    Fügt `allow-same-origin` zusätzlich zu `allow-scripts` für Dokumente derselben Website hinzu, die absichtlich stärkere Berechtigungen benötigen.
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

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie absichtlich möchten, dass `[embed url="https://..."]` Drittanbieterseiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chat-Nachrichten

Gruppierte Chat-Nachrichten verwenden eine gut lesbare Standard-Maximalbreite. Deployments mit breiten Monitoren können sie ohne Patchen des gebündelten CSS überschreiben, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentsätze wie `960px` oder `82%` sowie beschränkte Breiten-Ausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Halten Sie das Gateway auf loopback und lassen Sie Tailscale Serve es per HTTPS proxien:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem die Adresse `x-forwarded-for` mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage loopback mit Tailscales `x-forwarded-*`-Headern erreicht. Für Control-UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Geräte-Kopplungs-Roundtrip; Browser ohne Gerät und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Datenverkehr explizite Shared-Secret-Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungs-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, anstatt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden könnte, verlangen Sie Token-/Passwort-Authentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`)

    Fügen Sie das passende gemeinsame Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- nur für localhost gedachte unsichere HTTP-Kompatibilität mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Behebung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

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

    - Er ermöglicht localhost-Control-UI-Sitzungen ohne Geräteidentität in nicht sicheren HTTP-Kontexten.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (nicht lokale localhost-)Zugriffe.

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und stellt eine erhebliche Sicherheitsabsenkung dar. Setzen Sie dies nach der Notfallnutzung schnell wieder zurück.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Erfolgreiche trusted-proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - local loopback-Reverse-Proxys auf demselben Host erfüllen trusted-proxy-Authentifizierung weiterhin nicht; siehe [Trusted proxy auth](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Es sind nur Assets mit **gleichem Ursprung**, `data:`-URLs und lokal erzeugte `blob:`-URLs erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgewiesen und lösen keine Netzwerkabrufe aus.

Das bedeutet in der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Kanalmetadaten ausgegeben werden, werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo/Badge ersetzt. So kann ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe aus dem Browser eines Operators erzwingen.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten assistant-media-Route). Dadurch wird verhindert, dass die Avatar-Route die Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, damit das Bild in Dashboards weiterhin gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, entsprechend dem restlichen Gateway.

## UI erstellen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Erstellen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs wünschen):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für lokale Entwicklung (separater Dev-Server):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Testen: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, das Gateway aber anderswo läuft.

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
    - Wenn Sie einen vollständigen `ws://`- oder `wss://`-Endpunkt über `gatewayUrl` übergeben, URL-kodieren Sie den `gatewayUrl`-Wert, damit der Browser die Abfragezeichenfolge korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrageprotokollen und im Referer vermieden werden. Veraltete `?token=`-Abfrageparameter werden aus Kompatibilitätsgründen weiterhin einmal importiert, aber nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-loopback-Control-UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Ursprünge). Dazu gehören entfernte Dev-Setups.
    - Der Gateway-Start kann lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Laufzeit-Bind und -Port ableiten, aber entfernte Browser-Ursprünge benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nur für streng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Ursprung zu erlauben, nicht „den Host abgleichen, den ich gerade verwende“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Fallback-Modus für Host-Header-Ursprünge, ist aber ein gefährlicher Sicherheitsmodus.

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

Details zur Einrichtung des entfernten Zugriffs: [Remote access](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Health Checks](/de/gateway/health) — Gateway-Zustandsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
