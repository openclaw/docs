---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten Tailnet-Zugriff ohne SSH-Tunnel
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Knoten, Konfiguration)
title: Steuerungs-UI
x-i18n:
    generated_at: "2026-05-03T06:43:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

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
- Tailscale Serve-Identity-Header, wenn `gateway.auth.allowTailscale: true`
- Trusted-Proxy-Identity-Header, wenn `gateway.auth.mode: "trusted-proxy"`

Das Einstellungsfeld des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Beim Onboarding wird beim ersten Verbinden in der Regel ein Gateway-Token für Shared-Secret-Authentifizierung erzeugt, aber Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` `"password"` ist.

## Gerätekopplung (erste Verbindung)

Wenn Sie sich über einen neuen Browser oder ein neues Gerät mit der Control UI verbinden, verlangt das Gateway normalerweise eine **einmalige Kopplungsfreigabe**. Dies ist eine Sicherheitsmaßnahme, um unbefugten Zugriff zu verhindern.

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Bereiche/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn der Browser bereits gekoppelt ist und Sie ihn von Lesezugriff auf Schreib-/Adminzugriff ändern, wird dies als Genehmigungsupgrade behandelt, nicht als stille Wiederverbindung. OpenClaw behält die alte Genehmigung aktiv, blockiert die Verbindung mit erweitertem Zugriff und fordert Sie auf, den neuen Bereichssatz explizit zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, außer Sie widerrufen sie mit `openclaw devices revoke --device <id> --role <role>`. Siehe [Geräte-CLI](/de/cli/devices) für Token-Rotation und Widerruf.

<Note>
- Direkte local loopback-Browserverbindungen (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann die Kopplungsrunde für Control-UI-Operatorsitzungen überspringen, wenn `gateway.auth.allowTailscale: true` ist, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität vorlegt.
- Direkte Tailnet-Bindings, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine explizite Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID, daher erfordert ein Browserwechsel oder das Löschen von Browserdaten eine erneute Kopplung.

</Note>

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsamen Sitzungen angehängt wird. Sie liegt im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig dauerhaft gespeichert, abgesehen von den normalen Transcript-Autorschaftsmetadaten für Nachrichten, die Sie tatsächlich senden. Das Löschen von Websitedaten oder ein Browserwechsel setzt sie auf leer zurück.

Dasselbe browserlokale Muster gilt für die Überschreibung des Assistenten-Avatars. Hochgeladene Assistenten-Avatare überlagern die vom Gateway aufgelöste Identität nur im lokalen Browser und laufen niemals über `config.patch` zurück. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die das Feld direkt schreiben (z. B. geskriptete Gateways oder benutzerdefinierte Dashboards).

## Runtime-Konfigurationsendpunkt

Die Control UI ruft ihre Runtime-Einstellungen von `/__openclaw/control-ui-config.json` ab. Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung geschützt wie der restliche HTTP-Bereich: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert entweder ein bereits gültiges Gateway-Token/Passwort, eine Tailscale Serve-Identität oder eine Trusted-Proxy-Identität.

## Sprachunterstützung

Die Control UI kann sich beim ersten Laden anhand Ihrer Browser-Locale lokalisieren. Um dies später zu überschreiben, öffnen Sie **Übersicht -> Gateway-Zugriff -> Sprache**. Die Locale-Auswahl befindet sich in der Karte „Gateway-Zugriff“, nicht unter „Darstellung“.

- Unterstützte Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Nicht englische Übersetzungen werden im Browser lazy-loaded.
- Die ausgewählte Locale wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück.

Dokumentationsübersetzungen werden für denselben nicht englischen Locale-Satz erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite ist auf die Locale-Codes beschränkt, die Mintlify akzeptiert. Thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repository erzeugt; sie erscheint möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemes

Das Darstellungsfeld behält die integrierten Themes Claw, Knot und Dash sowie einen browserlokalen tweakcn-Importplatz. Um ein Theme zu importieren, öffnen Sie [tweakcn-Themes](https://tweakcn.com/themes), wählen oder erstellen Sie ein Theme, klicken Sie auf **Teilen** und fügen Sie den kopierten Theme-Link in „Darstellung“ ein. Der Importer akzeptiert außerdem `https://tweakcn.com/r/themes/<id>`-Registry-URLs, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade `/themes/<id>`, rohe Theme-IDs und Standard-Theme-Namen wie `amethyst-haze`.

Importierte Themes werden nur im aktuellen Browserprofil gespeichert. Sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Das Ersetzen des importierten Themes aktualisiert den einen lokalen Platz; das Löschen schaltet das aktive Theme zurück auf Claw, wenn das importierte Theme ausgewählt war.

## Was sie kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Talk">
    - Chatten Sie mit dem Modell über Gateway-WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sprechen Sie über Browser-Echtzeitsitzungen. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Einmal-Browser-Token über WebSocket, und reine Backend-Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Das Relay hält Provider-Zugangsdaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.realtime.relay*`-RPCs streamt und `openclaw_agent_consult`-Toolaufrufe über `chat.send` an das größere konfigurierte OpenClaw-Modell zurücksendet.
    - Streamen Sie Toolaufrufe und Live-Toolausgabekarten im Chat (Agent-Ereignisse).

  </Accordion>
  <Accordion title="Kanäle, Instanzen, Sitzungen, Träume">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und kanalbezogene Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Instanzen: Präsenzliste und Aktualisierung (`system-presence`).
    - Sitzungen: Liste und sitzungsbezogene Überschreibungen für Modell/Denken/Schnell/Verbose/Trace/Reasoning (`sessions.list`, `sessions.patch`).
    - Träume: Dreaming-Status, Aktivieren/Deaktivieren-Schalter und Dream-Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, Exec-Genehmigungen">
    - Cron-Jobs: auflisten/hinzufügen/bearbeiten/ausführen/aktivieren/deaktivieren und Ausführungsverlauf (`cron.*`).
    - Skills: Status, aktivieren/deaktivieren, installieren, API-Schlüssel aktualisieren (`skills.*`).
    - Nodes: Liste und Funktionen (`node.list`).
    - Exec-Genehmigungen: Gateway- oder Node-Allowlists und Abfragerichtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Mit Validierung anwenden und neu starten (`config.apply`) und die letzte aktive Sitzung aufwecken.
    - Schreibvorgänge enthalten einen Basis-Hash-Schutz, um das Überschreiben gleichzeitiger Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die Auflösung aktiver SecretRef-Verweise für Verweise in der übermittelten Konfigurations-Payload; nicht auflösbare aktive übermittelte Verweise werden vor dem Schreiben abgelehnt.
    - Schema- und Formularrendering (`config.schema` / `config.schema.lookup`, einschließlich Feld-`title` / `description`, passender UI-Hinweise, direkter Kindelement-Zusammenfassungen, Dokumentationsmetadaten auf verschachtelten Objekt-/Wildcard-/Array-/Kompositionsknoten sowie Plugin- und Kanalschemas, wenn verfügbar); der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip hat.
    - Wenn ein Snapshot Raw-Text nicht sicher im Roundtrip verarbeiten kann, erzwingt die Control UI den Formularmodus und deaktiviert den Raw-Modus für diesen Snapshot.
    - Im Raw-JSON-Editor bewahrt „Auf gespeichert zurücksetzen“ die roh verfasste Struktur (Formatierung, Kommentare, `$include`-Layout), statt einen abgeflachten Snapshot neu zu rendern, sodass externe Änderungen einen Reset überstehen, wenn der Snapshot sicher im Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Formulartexteingaben schreibgeschützt gerendert, um versehentliche Objekt-zu-String-Beschädigungen zu verhindern.

  </Accordion>
  <Accordion title="Debug, Protokolle, Aktualisierung">
    - Debug: Status-/Health-/Modell-Snapshots, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Protokolle: Live-Tail der Gateway-Dateiprotokolle mit Filter/Export (`logs.tail`).
    - Aktualisierung: Paket-/Git-Aktualisierung und Neustart ausführen (`update.run`) mit Neustartbericht; anschließend nach der Wiederverbindung `update.status` abfragen, um die laufende Gateway-Version zu verifizieren.

  </Accordion>
  <Accordion title="Hinweise zum Cron-Jobs-Feld">
    - Für isolierte Jobs ist die Zustellung standardmäßig auf Ankündigungszusammenfassung gesetzt. Sie können auf „keine“ wechseln, wenn Sie nur interne Ausführungen wünschen.
    - Kanal-/Zielfelder erscheinen, wenn Ankündigung ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"` mit `delivery.to`, gesetzt auf eine gültige HTTP(S)-Webhook-URL.
    - Für Jobs in der Hauptsitzung sind die Zustellmodi Webhook und „keine“ verfügbar.
    - Erweiterte Bearbeitungssteuerelemente umfassen Löschen nach Ausführung, Zurücksetzen der Agent-Überschreibung, Cron-Optionen für exakt/gestaffelt, Agent-Modell-/Denken-Überschreibungen und Best-Effort-Zustellungsschalter.
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
    - `chat.history`-Antworten sind aus UI-Sicherheitsgründen größenbegrenzt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, große Metadatenblöcke weglassen und übergroße Nachrichten durch einen Platzhalter (`[chat.history omitted: message too large]`) ersetzen.
    - Vom Assistant generierte Bilder werden als verwaltete Medienreferenzen persistiert und über authentifizierte Gateway-Medien-URLs zurückgegeben, sodass erneutes Laden nicht davon abhängt, dass rohe base64-Bildnutzlasten in der Chat-Verlaufsantwort verbleiben.
    - `chat.history` entfernt außerdem rein anzeigeorientierte Inline-Direktiv-Tags aus sichtbarem Assistant-Text (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Plain-Text-XML-Nutzlasten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzte Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken und lässt Assistant-Einträge weg, deren gesamter sichtbarer Text nur das exakte stille Token `NO_REPLY` / `no_reply` ist.
    - Während eines aktiven Sendens und der abschließenden Verlaufsaktualisierung hält die Chat-Ansicht lokale optimistische Nutzer-/Assistant-Nachrichten sichtbar, wenn `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - `chat.inject` hängt eine Assistant-Notiz an das Sitzungstranskript an und sendet ein `chat`-Event für reine UI-Aktualisierungen (kein Agent-Lauf, keine Channel-Zustellung).
    - Die Modell- und Thinking-Auswahllisten im Chat-Header patchen die aktive Sitzung sofort über `sessions.patch`; sie sind persistente Sitzungsüberschreibungen, keine nur für einen einzelnen Turn geltenden Sendeoptionen.
    - Die Eingabe von `/new` in der Control UI erstellt und wechselt zu derselben frischen Dashboard-Sitzung wie New Chat. Die Eingabe von `/reset` behält den expliziten In-place-Reset des Gateway für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateway an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Allowlist die Auswahl. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn frische Gateway-Sitzungsnutzungsberichte hohen Kontextdruck anzeigen, zeigt der Chat-Composer-Bereich einen Kontexthinweis und bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche, die den normalen Sitzungs-Compaction-Pfad ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway wieder frische Nutzung meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, oder konfigurieren Sie Google mit `talk.provider: "google"` plus `talk.providers.google.apiKey`; die Echtzeit-Provider-Konfiguration für Voice Call kann weiterhin als Fallback wiederverwendet werden. Der Browser erhält niemals einen Standard-Provider-API-Schlüssel. OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC. Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Auth-Token für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen vom Gateway im Token fixiert werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, laufen über den Gateway-Relay-Transport, sodass Zugangsdaten und Vendor-Sockets serverseitig bleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Realtime-Sitzungsprompt wird vom Gateway zusammengesetzt; `talk.realtime.session` akzeptiert keine vom Aufrufer bereitgestellten Anweisungsüberschreibungen.

    Im Chat-Composer ist das Talk-Steuerelement die Wellen-Schaltfläche neben der Mikrofon-Diktat-Schaltfläche. Wenn Talk startet, zeigt die Composer-Statuszeile `Connecting Talk...`, danach `Talk live`, während Audio verbunden ist, oder `Asking OpenClaw...`, während ein Echtzeit-Tool-Aufruf das konfigurierte größere Modell über `chat.send` konsultiert.

    Maintainer-Live-Smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifiziert den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung von Google Live mit eingeschränktem Token für Browser-WebSocket und den Gateway-Relay-Browseradapter mit gefälschten Mikrofonmedien. Der Befehl gibt nur Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer wartenden Nachricht auf **Steer**, um diese Folgeanfrage in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des normalen Ablaufs abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (kein `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Aufbewahrung von Abbruch-Teilergebnissen">
    - Wenn ein Lauf abgebrochen wird, kann partieller Assistant-Text weiterhin in der UI angezeigt werden.
    - Der Gateway persistiert abgebrochenen partiellen Assistant-Text im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist.
    - Persistierte Einträge enthalten Abbruchmetadaten, sodass Transkriptverbraucher Abbruch-Teilergebnisse von normaler Abschlussausgabe unterscheiden können.

  </Accordion>
</AccordionGroup>

## PWA-Installation und Web Push

Die Control UI liefert ein `manifest.webmanifest` und einen Service Worker aus, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA mit Benachrichtigungen zu wecken, selbst wenn der Tab oder das Browserfenster nicht geöffnet ist.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „App installieren“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Events und Benachrichtigungsklicks verarbeitet. |
| `push/vapid-keys.json` (unter dem OpenClaw-Statusverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzlasten. |
| `push/web-push-subscriptions.json`                    | Persistierte Browser-Subscription-Endpunkte.                       |

Überschreiben Sie das VAPID-Schlüsselpaar über Env-Vars im Gateway-Prozess, wenn Sie Schlüssel fest pinnen möchten (für Multi-Host-Deployments, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standardmäßig `mailto:openclaw@localhost`)

Die Control UI verwendet diese Scope-gebundenen Gateway-Methoden, um Browser-Subscriptions zu registrieren und zu testen:

- `push.web.vapidPublicKey` — ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` — registriert einen `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — entfernt einen registrierten Endpunkt.
- `push.web.test` — sendet eine Testbenachrichtigung an die Subscription des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für relay-gestütztes Push) und von der bestehenden Methode `push.test`, die auf natives Mobile Pairing abzielt.
</Note>

## Gehostete Einbettungen

Assistant-Nachrichten können gehostete Webinhalte inline mit dem `[embed ...]`-Shortcode rendern. Die iframe-Sandbox-Richtlinie wird über `gateway.controlUi.embedSandbox` gesteuert:

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung in gehosteten Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Erlaubt interaktive Einbettungen bei beibehaltener Origin-Isolation; dies ist der Standard und reicht normalerweise für eigenständige Browser-Spiele/-Widgets aus.
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

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Wenn Sie bewusst möchten, dass `[embed url="https://..."]` Drittanbieter-Seiten lädt, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chat-Nachrichten

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

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Werte umfassen einfache Längen und Prozentwerte wie `960px` oder `82%` sowie eingeschränkte `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- und `fit-content(...)`-Breitenausdrücke.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Lassen Sie den Gateway auf local loopback und Tailscale Serve ihn mit HTTPS proxien:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie:

    - `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Standardmäßig können Control UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` `true` ist. OpenClaw verifiziert die Identität, indem die `x-forwarded-for`-Adresse mit `tailscale whois` aufgelöst und mit dem Header abgeglichen wird, und akzeptiert diese nur, wenn die Anfrage local loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control UI-Operator-Sitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Device-Pairing-Roundtrip; gerätelose Browser und Verbindungen mit Node-Rolle folgen weiterhin den normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Traffic explizite Shared-Secret-Zugangsdaten verlangen möchten. Verwenden Sie dann `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Auth-Scope vor Rate-Limit-Schreibvorgängen serialisiert. Gleichzeitige fehlerhafte Wiederholungen aus demselben Browser können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Nichtübereinstimmungen parallel konkurrieren.

    <Warning>
    Tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn auf diesem Host nicht vertrauenswürdiger lokaler Code laufen kann, verlangen Sie Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie anschließend:

    - `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`)

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (gesendet als `connect.params.auth.token` oder `connect.params.auth.password`).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über unverschlüsseltes HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), läuft der Browser in einem **nicht sicheren Kontext** und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur-localhost-Kompatibilität für unsicheres HTTP mit `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Break-Glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (auf dem Gateway-Host)

<AccordionGroup>
  <Accordion title="Verhalten des Insecure-Auth-Umschalters">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` ist nur ein lokaler Kompatibilitätsumschalter:

    - Er ermöglicht localhost-Control-UI-Sitzungen in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Kopplungsprüfungen.
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
    `dangerouslyDisableDeviceAuth` deaktiviert die Geräteidentitätsprüfungen der Control UI und ist eine erhebliche Sicherheitsabschwächung. Setzen Sie diese Einstellung nach einer Notfallnutzung schnell zurück.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu Trusted Proxy">
    - Erfolgreiche Trusted-Proxy-Authentifizierung kann **Operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Loopback-Reverse-Proxys auf demselben Host erfüllen weiterhin keine Trusted-Proxy-Authentifizierung; siehe [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Siehe [Tailscale](/de/gateway/tailscale) für Anleitungen zur HTTPS-Einrichtung.

## Content Security Policy

Die Control UI wird mit einer strikten `img-src`-Policy ausgeliefert: Es sind nur Assets vom **selben Origin**, `data:`-URLs und lokal generierte `blob:`-URLs erlaubt. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen keine Netzwerkabrufe aus.

Was das in der Praxis bedeutet:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin gerendert, einschließlich authentifizierter Avatar-Routen, die die UI abruft und in lokale `blob:`-URLs umwandelt.
- Inline-`data:image/...`-URLs werden weiterhin gerendert (nützlich für Payloads innerhalb des Protokolls).
- Lokale `blob:`-URLs, die von der Control UI erstellt werden, werden weiterhin gerendert.
- Entfernte Avatar-URLs, die von Channel-Metadaten ausgegeben werden, werden in den Avatar-Helfern der Control UI entfernt und durch das integrierte Logo/Badge ersetzt, sodass ein kompromittierter oder böswilliger Channel keine beliebigen entfernten Bildabrufe aus einem Operator-Browser erzwingen kann.

Sie müssen nichts ändern, um dieses Verhalten zu erhalten — es ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI denselben Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatar-Bild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der benachbarten Assistant-Media-Route). Dadurch wird verhindert, dass die Avatar-Route Agent-Identität auf Hosts preisgibt, die ansonsten geschützt sind.
- Die Control UI leitet den Gateway-Token beim Abrufen von Avataren selbst als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, sodass das Bild weiterhin in Dashboards gerendert wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird auch die Avatar-Route nicht authentifiziert, im Einklang mit dem restlichen Gateway.

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

## Debugging/Tests: Dev-Server + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Origin unterscheiden. Das ist praktisch, wenn Sie den Vite-Dev-Server lokal verwenden möchten, das Gateway aber an anderer Stelle läuft.

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-codieren Sie den `gatewayUrl`-Wert, damit der Browser die Query-Zeichenfolge korrekt parst.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Lecks über Anfrage-Logs und Referer vermieden werden. Veraltete `?token=`-Query-Parameter werden aus Kompatibilitätsgründen weiterhin einmalig importiert, jedoch nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird nur im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` gesetzt ist, fällt die UI nicht auf Konfigurations- oder Umgebungs-Credentials zurück. Geben Sie `token` (oder `password`) explizit an. Fehlende explizite Credentials sind ein Fehler.
    - Verwenden Sie `wss://`, wenn das Gateway hinter TLS liegt (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Top-Level-Fenster akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Nicht-Loopback-Control-UI-Bereitstellungen müssen `gateway.controlUi.allowedOrigins` explizit festlegen (vollständige Origins). Dazu gehören entfernte Dev-Setups.
    - Der Gateway-Start kann lokale Origins wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus dem effektiven Runtime-Bind und Port vorbefüllen, aber entfernte Browser-Origins benötigen weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` nicht außer für eng kontrollierte lokale Tests. Es bedeutet, jeden Browser-Origin zu erlauben, nicht „mit dem Host übereinstimmen, den ich gerade verwende“.
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

Details zur Einrichtung des Fernzugriffs: [Fernzugriff](/de/gateway/remote).

## Verwandt

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Integritätsprüfungen](/de/gateway/health) — Gateway-Integritätsüberwachung
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
