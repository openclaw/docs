---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungs-UI für das Gateway (Chat, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-05-04T09:37:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit** Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** auf demselben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer läuft, öffnen Sie:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/))

Wenn die Seite nicht geladen wird, starten Sie zuerst das Gateway: `openclaw gateway`.

Auth wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identitätsheader, wenn `gateway.auth.mode: "trusted-proxy"`

Das Dashboard-Einstellungsfenster speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht persistent gespeichert. Das Onboarding erzeugt beim ersten Verbindungsaufbau normalerweise ein Gateway-Token für Shared-Secret-Auth, aber Passwort-Auth funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie von einem neuen Browser oder Gerät aus eine Verbindung zur Control UI herstellen, verlangt das Gateway normalerweise eine **einmalige Kopplungsfreigabe**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

**Was Sie sehen werden:** „disconnected (1008): pairing required“

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

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Admin-Zugriff ändern, wird dies als Genehmigungs-Upgrade behandelt, nicht als stille erneute Verbindung. OpenClaw hält die alte Genehmigung aktiv, blockiert die weitergehende erneute Verbindung und fordert Sie auf, den neuen Scope-Satz ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie es nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Siehe [Devices CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann die Kopplungsrunde für Operator-Sitzungen der Control UI überspringen, wenn `gateway.auth.allowTailscale: true`, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität bereitstellt.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID. Wenn Sie also den Browser wechseln oder Browserdaten löschen, ist eine erneute Kopplung erforderlich.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine browserbezogene persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsamen Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normalen Metadaten zur Autorenschaft im Transcript der tatsächlich gesendeten Nachrichten hinaus gespeichert. Das Löschen von Websitedaten oder der Wechsel des Browsers setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und werden niemals über `config.patch` zurückgesendet. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. geskriptete Gateways oder benutzerdefinierte Dashboards).

## Laufzeit-Konfigurationsendpunkt

Die Control UI ruft ihre Laufzeiteinstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt wird durch dieselbe Gateway-Auth geschützt wie der Rest der HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale-Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Karte „Gateway-Zugriff“, nicht unter „Darstellung“.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Docs-Übersetzungen werden für denselben nicht englischen Locale-Satz generiert, aber die integrierte Mintlify-Sprachauswahl der Docs-Site ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Docs werden weiterhin im Publish-Repo generiert; sie werden in dieser Auswahl möglicherweise erst angezeigt, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungsfenster behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Import-Slot bei. Um ein Theme zu importieren, öffnen Sie den [tweakcn editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in „Darstellung“ ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative `/themes/<id>`-Pfade, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht zwischen Geräten synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Slot; das Löschen wechselt das aktive Theme zurück zu Claw, wenn das importierte Theme ausgewählt war.

## Was sie tun kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Sprechen">
    - Chatten Sie mit dem Modell über Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes einmaliges Browser-Token über WebSocket, und rein backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Das Relay hält Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.realtime.relay*`-RPCs streamt und `openclaw_agent_consult`-Toolaufrufe über `chat.send` an das größere konfigurierte OpenClaw-Modell zurücksendet.
    - Streamen Sie Toolaufrufe und Live-Tool-Ausgabekarten im Chat (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: integrierte sowie gebündelte/externe Plugin-Kanäle mit Status, QR-Anmeldung und kanalbezogener Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Instanzen: Präsenzliste und Aktualisierung (`system-presence`).
    - Sitzungen: Liste sowie sitzungsbezogene Überschreibungen für Modell/Thinking/Fast/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Schalter zum Aktivieren/Deaktivieren und Dream-Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: Liste und Caps (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlisten sowie Ask-Policy für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Mit Validierung anwenden und neu starten (`config.apply`) und die zuletzt aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Base-Hash-Schutz, um das Überschreiben gleichzeitiger Bearbeitungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die Auflösung aktiver SecretRef-Einträge für Referenzen in der übermittelten Konfigurationsnutzlast; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Schema- und Formular-Rendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, unmittelbarer Kindzusammenfassungen, Docs-Metadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- und Kanal-Schemas, sofern verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher im Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - „Auf gespeichert zurücksetzen“ im Raw-JSON-Editor bewahrt die roh verfasste Struktur (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Bearbeitungen einen Reset überstehen, wenn der Snapshot sicher im Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formular-Texteingaben schreibgeschützt gerendert, um eine versehentliche Beschädigung von Objekt zu String zu verhindern.

  </Accordion>
  <Accordion title="Debug, Logs, Update">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Aktualisierungs-/RPC-Zeiten der Control UI sowie Einträge zur Browser-Reaktionsfähigkeit für lange Animationsframes oder lange Tasks, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Logs: Live-Tail der Gateway-Dateilogs mit Filter/Export (`logs.tail`).
    - Update: Paket-/Git-Update und Neustart ausführen (`update.run`) mit Neustartbericht, dann nach dem erneuten Verbinden `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Fenster">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Zusammenfassung ankündigen gesetzt. Sie können auf keine umstellen, wenn Sie rein interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigen ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
    - Für Jobs in der Hauptsitzung sind die Zustellmodi Webhook und keine verfügbar.
    - Erweiterte Bearbeitungssteuerungen enthalten „nach Ausführung löschen“, Agent-Überschreibung löschen, Cron-Exact-/Stagger-Optionen, Agent-Modell-/Thinking-Überschreibungen und Best-Effort-Zustellungsschalter.
    - Die Formularvalidierung erfolgt inline mit feldbezogenen Fehlern; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert sind.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wenn es weggelassen wird, wird der Webhook ohne Auth-Header gesendet.
    - Veralteter Fallback: Gespeicherte Legacy-Jobs mit `notify: true` können bis zur Migration weiterhin `cron.webhook` verwenden.

  </Accordion>
</AccordionGroup>

## Chat-Verhalten

<AccordionGroup>
  <Accordion title="Sende- und Verlaufsemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Events gestreamt.
    - Chat-Uploads akzeptieren Bilder sowie Nicht-Video-Dateien. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhanglinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` zurück und nach Abschluss `{ status: "ok" }`.
    - `chat.history`-Antworten sind aus Gründen der UI-Sicherheit größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann das Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Vom Assistenten generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs wieder bereitgestellt, sodass Reloads nicht davon abhängen, dass rohe base64-Bild-Payloads in der Chat-Verlaufsantwort verbleiben.
    - `chat.history` entfernt außerdem nur zur Anzeige dienende Inline-Direktiv-Tags aus sichtbarem Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Klartext-XML-Payloads für Tool-Aufrufe (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstokens und lässt Assistenteneinträge aus, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` ist.
    - Während eines aktiven Sendevorgangs und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Events sind Zustellstatus, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach finalen Tool-Events lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist in [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Event für reine UI-Aktualisierungen (kein Agent-Lauf, keine Kanalzustellung).
    - Der Chat-Header zeigt den Agentenfilter vor der Sitzungsauswahl, und die Sitzungsauswahl ist auf den ausgewählten Agenten begrenzt. Beim Wechseln von Agenten werden nur Sitzungen angezeigt, die mit diesem Agenten verknüpft sind, und es wird auf die Hauptsitzung dieses Agenten zurückgegriffen, wenn er noch keine gespeicherten Dashboard-Sitzungen hat.
    - Auf Desktop-Breiten bleiben Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; Heraufscrollen, Rückkehr zum Anfang oder Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende doppelte reine Textnachrichten werden als eine Sprechblase mit Zähler-Badge dargestellt. Nachrichten mit Bildern, Anhängen, Tool-Ausgaben oder Canvas-Vorschauen bleiben nicht zusammengeklappt.
    - Die Modell- und Denkmodusauswahlen im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine nur für einen Turn geltenden Sendeoptionen.
    - Die Eingabe von `/new` in der Control UI erstellt dieselbe neue Dashboard-Sitzung wie Neuer Chat und wechselt dorthin. Die Eingabe von `/reset` behält den expliziten In-Place-Reset des Gateways für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge plus Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-`models.list`-RPC mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte hohen Kontextdruck anzeigen, zeigt der Chat-Composer-Bereich einen Kontexthinweis und bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzungspfad für Compaction ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis das Gateway wieder frische Nutzung meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Voice-Provider. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder konfigurieren Sie Google mit `talk.provider: "google"` plus `talk.providers.google.apiKey`; die Echtzeit-Provider-Konfiguration für Voice Call kann weiterhin als Fallback wiederverwendet werden. Der Browser erhält niemals einen standardmäßigen Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token gesperrt werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Anmeldedaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Im Chat-Composer ist die Sprechsteuerung die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, danach `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `chat.send` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung des eingeschränkten Google Live-Token-Browser-WebSocket und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Geheimnisse.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen eingereiht. Klicken Sie bei einer eingereihten Nachricht auf **Steer**, um diese Folgeanfrage in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um out-of-band abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (kein `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung partieller Abbruchausgaben">
    - Wenn ein Lauf abgebrochen wird, kann partieller Assistententext weiterhin in der UI angezeigt werden.
    - Das Gateway persistiert abgebrochenen partiellen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, damit Transkriptkonsumenten partielle Abbruchausgaben von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, auch wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Events und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unterhalb des OpenClaw-State-Verzeichnisses) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Payloads. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Env-Vars im Gateway-Prozess, wenn Sie Schlüssel festlegen möchten (für Multi-Host-Deployments, Geheimnisrotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `mailto:openclaw@localhost`)

Die Control UI verwendet diese scope-gesteuerten Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestützte Push-Benachrichtigungen) und von der bestehenden Methode `push.test`, die auf natives Mobile-Pairing abzielen.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte inline mit dem Shortcode `[embed ...]` rendern. Die iframe-Sandbox-Richtlinie wird über `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen bei beibehaltener Origin-Isolation; dies ist der Standard und reicht normalerweise für eigenständige Browserspiele/-Widgets aus.
  </Tab>
  <Tab title="trusted">
    Fügt zusätzlich zu `allow-scripts` `allow-same-origin` für Same-Site-Dokumente hinzu, die absichtlich stärkere Berechtigungen benötigen.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument wirklich Same-Origin-Verhalten benötigt. Für die meisten agentengenerierten Spiele und interaktiven Canvases ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie absichtlich möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chat-Nachrichtenbreite

Gruppierte Chat-Nachrichten verwenden standardmäßig eine gut lesbare maximale Breite. Deployments mit breiten Monitoren können sie überschreiben, ohne gebündeltes CSS zu patchen, indem `gateway.controlUi.chatMessageMaxWidth` gesetzt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentsätze wie `960px` oder `82%` sowie eingeschränkte Breiten-Ausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Belassen Sie das Gateway auf local loopback und lassen Sie Tailscale Serve es mit HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem die Adresse `x-forwarded-for` mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage local loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control-UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Geräte-Pairing-Roundtrip; gerätelose Browser und Node-Rollen-Verbindungen folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Datenverkehr explizite Shared-Secret-Anmeldedaten erzwingen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, erzwingen Sie Token-/Passwort-Authentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie dann:

    - `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Fügen Sie das passende gemeinsame Geheimnis in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

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

    - Er erlaubt Localhost-Control UI-Sitzungen, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Pairing-Prüfungen.
    - Er lockert keine Anforderungen an die Geräteidentität für entfernte (Nicht-Localhost-)Verbindungen.

  </Accordion>
  <Accordion title="Nur Break-Glass">
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
    `dangerouslyDisableDeviceAuth` deaktiviert Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsverschlechterung. Machen Sie dies nach der Notfallnutzung schnell rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu Trusted Proxy">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control UI-Sitzungen mit Node-Rolle.
    - Same-Host-Loopback-Reverse-Proxys erfüllen die Trusted-Proxy-Authentifizierung weiterhin nicht; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Hinweise zur HTTPS-Einrichtung.

## Content-Security-Policy

Die Control UI wird mit einer strengen `img-src`-Policy ausgeliefert: Nur Assets mit **same-origin**, `data:`-URLs und lokal erzeugte `blob:`-URLs sind erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkanfragen aus.

Was das praktisch bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für In-Protocol-Payloads).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Kanalmetadaten ausgegeben werden, werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder bösartiger Kanal keine beliebigen entfernten Bildabrufe aus dem Browser eines Operators erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route die Agentenidentität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI selbst leitet beim Abrufen von Avataren das Gateway-Token als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, damit das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird die Avatar-Route ebenfalls nicht authentifiziert, im Einklang mit dem Rest des Gateways.

## Authentifizierung der Assistant-Media-Route

Wenn Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistant eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operator-Authentifizierung der Control UI. Der Browser sendet das Gateway-Token beim Prüfen der Verfügbarkeit als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, das auf genau diesen Quellpfad beschränkt ist.
- Vom Browser gerenderte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` statt des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

So bleibt normales Medien-Rendering mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Zugangsdaten in sichtbaren Medien-URLs abzulegen.

## UI bauen

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit. Bauen Sie sie mit:

```bash
pnpm ui:build
```

Optionale absolute Basis (wenn Sie feste Asset-URLs verwenden möchten):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Für die lokale Entwicklung (separater Entwicklungsserver):

```bash
pnpm ui:dev
```

Richten Sie die UI dann auf Ihre Gateway-WS-URL aus (z. B. `ws://127.0.0.1:18789`).

## Debugging/Testing: Entwicklungsserver + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Entwicklungsserver lokal verwenden möchten, das Gateway aber anderswo läuft.

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-kodieren Sie den Wert `gatewayUrl`, damit der Browser den Query-String korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks in Anfrage-Logs und Referern vermieden werden. Legacy-Query-Parameter `?token=` werden aus Kompatibilitätsgründen weiterhin einmal importiert, jedoch nur als Fallback, und direkt nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-Loopback-Bereitstellungen der Control UI müssen `gateway.controlUi.allowedOrigins` explizit setzen (vollständige Origins). Dies umfasst entfernte Entwicklungsumgebungen.
    - Der Gateway-Start kann lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port vorbefüllen, aber entfernte Browser-Origins benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nicht, außer für streng kontrolliertes lokales Testing. Es bedeutet, beliebige Browser-Origins zuzulassen, nicht „mit dem Host übereinstimmen, den ich gerade verwende“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Fallback-Modus für Host-Header-Origins, ist aber ein gefährlicher Sicherheitsmodus.

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
- [Health Checks](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
