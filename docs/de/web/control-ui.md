---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten ohne SSH-Tunnel auf das Tailnet zugreifen
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für den Gateway (Chat, Aktivität, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-07-24T05:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9f32dab68747a5d806b75e7a3ba9432aaa17f2145b82843fb1ca50457b90b397
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine **Vite + Lit**-Single-Page-App, die vom Gateway bereitgestellt wird:

- Standard: `http://<host>:18789/`
- optionales Präfix: `gateway.controlUi.basePath` festlegen (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** am selben Port.

Während Sie eine laufende Sitzung beobachten, kann das Gateway das Utility-Modell dieses Agenten verwenden, um eine kompakte Statuszusammenfassung zu erstellen. Im Chat wird sie als einzeilige Statusanzeige dargestellt, die sich zu einer Karte mit Bewertung, Planfortschritt, Pull Requests und verstrichener Zeit erweitern lässt. Die Karte kann sich einmal erweitern, wenn ein Lauf feststeckt oder Eingaben benötigt; der Seitenchat `/btw` hat Vorrang vor der erweiterten Karte.

Die erweiterte Karte akzeptiert außerdem kurze Fragen zum Lauf. Antworten verwenden ausschließlich die aktuelle Zusammenfassung des Beobachters und bereinigte, begrenzte Notizen, verbleiben für diese Sitzung im Browser und gelangen niemals in den Hauptlauf des Agenten oder unterbrechen ihn. Wenn die Beobachtungen keine Antwort enthalten, gibt der Beobachter an, dass er sie nicht kennen kann.

Nachdem die erste Zusammenfassung eingegangen ist, bestimmt sie anstelle heuristischer Live-Aktivität den Untertitel dieses Laufs in der Seitenleiste. Eine abschließende Zusammenfassung mit dem Status „abgeschlossen“ oder „fehlgeschlagen“ bleibt sichtbar, solange die Sitzung ungelesen ist; anschließend zeigt die Zeile wieder ihren normalen Arbeitsuntertitel.

Die Sitzungsbeobachtung ist standardmäßig aktiviert. Unter **Settings > Appearance > Sidebar** können Sie sie Gateway-weit deaktivieren, das ermittelte kleine Modell und seine Herkunft prüfen oder automatisches Routing wählen, Utility-Aufgaben deaktivieren oder ein explizites `agents.defaults.utilityModel` auswählen. Die entsprechenden Konfigurationsoptionen sind `gateway.controlUi.sessionObserver: false` und `agents.defaults.utilityModel: ""`.

## Schnellzugriff (lokal)

Wenn das Gateway auf demselben Computer ausgeführt wird, öffnen Sie [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/)).

Wenn die Seite nicht geladen werden kann, starten Sie zuerst das Gateway: `openclaw gateway`.

<Note>
Bei nativen Windows-LAN-Bindungen können die Windows Firewall oder organisationsverwaltete Gruppenrichtlinien die angegebene LAN-URL weiterhin blockieren, selbst wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, nicht übereinstimmende Profile und lokale Firewallregeln, die möglicherweise durch Richtlinien außer Kraft gesetzt werden.
</Note>

Die Authentifizierung wird während des WebSocket-Handshakes bereitgestellt über:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Die Gateway-Authentifizierung erfolgt vor der Gerätekopplung. Eine direkte Loopback-Verbindung umgeht weder die Token- noch die Passwortauthentifizierung. Das Einstellungsfenster des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Nach der Kopplung kann der Browser bei späteren Verbindungen sein gespeichertes gerätespezifisches Token verwenden.

Beim Onboarding wird üblicherweise ein Gateway-Token für die Authentifizierung mit einem gemeinsamen Geheimnis konfiguriert. Wenn das Gateway im Tokenmodus ohne konfiguriertes Token startet, generiert es stattdessen ein flüchtiges Laufzeit-Token für diesen Prozess. Das Laufzeit-Token wird nicht in die Konfiguration geschrieben, sodass `openclaw config get gateway.auth.token` es nicht abrufen kann und ein Loopback-Browser ohne dieses Token abgewiesen wird. Führen Sie `openclaw doctor --generate-gateway-token` aus, starten Sie das Gateway neu und fügen Sie anschließend das konfigurierte Token in den Einstellungen der Control UI ein. Alternativ funktioniert die Passwortauthentifizierung, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Nachdem die Gateway-Authentifizierung erfolgreich war, erfordert die Verbindung über einen neuen Browser oder ein neues Gerät üblicherweise eine **einmalige Kopplungsgenehmigung**, die als `disconnected (1008): pairing required` angezeigt wird.

<Warning>
Bei einem direkten Upgrade von einer Version, die die eingestellte
Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true` verwendete,
hält OpenClaw den durch Token, Passwort oder einen vertrauenswürdigen Proxy authentifizierten Zugriff auf die Control UI
für eine ausschließlich der Kopplungsbehebung dienende Maßnahme verfügbar. Wenn der Browser einfaches HTTP verwendet und keine Geräteidentität erstellen kann,
öffnen Sie ihn zunächst erneut über HTTPS oder localhost. Klicken Sie anschließend im
Warnbanner auf **Secure this browser**. Das Gateway kehrt erst zur normalen Durchsetzung der Geräteauthentifizierung zurück,
nachdem ein signierter Browser ausdrücklich gekoppelt wurde; es erstellt oder genehmigt niemals eine
Identität für einen Browser ohne Gerät. Der Übergang ist nicht verfügbar, wenn
bereits ein anderes Bediengerät gekoppelt ist. Sowohl der Gateway-Start als auch
`openclaw doctor --fix` melden diese Migration ausdrücklich, anstatt
den alten Schlüssel stillschweigend zu verwerfen.
</Warning>

<Steps>
  <Step title="Ausstehende Anfragen auflisten">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Anhand der Anfrage-ID genehmigen">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Berechtigungsbereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt; führen Sie `openclaw devices list` vor der Genehmigung erneut aus.

Der Wechsel eines bereits gekoppelten Remote-Browsers vom Lesezugriff zum Schreib-/Administratorzugriff wird als Genehmigungserweiterung und nicht als stillschweigende Wiederverbindung behandelt: OpenClaw hält die alte Genehmigung aktiv, blockiert die Wiederverbindung mit erweiterten Rechten und fordert Sie auf, den neuen Satz von Berechtigungsbereichen ausdrücklich zu genehmigen. Eine geeignete direkte Loopback-Verbindung der Control UI kann die Erweiterung nach erfolgreicher Authentifizierung stillschweigend genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie diese nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Informationen zur Tokenrotation, zum Widerruf und zum Genehmigungsablauf beim ersten Start von Paperclip / `openclaw_gateway` finden Sie unter [Geräte-CLI](/de/cli/devices).

<Note>
- Direkte lokale Control-UI-Verbindungen von einem Loopback-TCP-Peer (`127.0.0.1` oder `::1`, üblicherweise erreichbar als `localhost`) ohne Weiterleitungs-/Proxy-Header können die Gerätekopplung nur dann automatisch genehmigen, wenn die Gateway-Authentifizierung erfolgreich war und der Browser eine Geräteidentität vorlegt. Im Token-/Passwortmodus benötigt die erste Verbindung weiterhin das konfigurierte gemeinsame Geheimnis; diese automatische Genehmigung ist keine Umgehung des Tokens.
- Eine direkte Loopback-Verbindung benötigt nur dann kein gemeinsames Geheimnis, wenn `gateway.auth.mode: "none"` ausdrücklich konfiguriert ist. Dadurch wird die Gateway-Authentifizierung deaktiviert; dies ist nicht die empfohlene Einrichtung der Control UI. In den Modi Tailscale Serve und vertrauenswürdiger Proxy kann auf das Einfügen eines gemeinsamen Geheimnisses nur verzichtet werden, wenn die jeweiligen Identitätsprüfungen erfolgreich sind.
- Tailscale Serve kann den Kopplungsumlauf für Bedienersitzungen der Control UI überspringen, wenn `gateway.auth.allowTailscale: true` gilt, die Tailscale-Identität verifiziert wurde und der Browser seine Geräteidentität vorlegt. Browser ohne Geräteidentität und Verbindungen mit Node-Rolle unterliegen weiterhin den normalen Geräteprüfungen.
- Direkte Tailnet-Bindungen und LAN-Browserverbindungen erfordern weiterhin eine ausdrückliche Genehmigung. Browserprofile ohne Geräteidentität können die automatische Loopback-Genehmigung nicht verwenden.
- Jedes Browserprofil generiert eine eindeutige Geräte-ID. Daher ist nach einem Browserwechsel oder dem Löschen der Browserdaten eine erneute Kopplung erforderlich.

</Note>

## Mobilgerät koppeln

Ein bereits gekoppelter Administrator kann den iOS-/Android-Verbindungs-QR-Code erstellen, ohne ein Terminal zu öffnen:

<Steps>
  <Step title="Mobile Kopplung öffnen">
    Wählen Sie **Devices** und klicken Sie anschließend auf der Karte **Devices** auf **Pair mobile device**.
  </Step>
  <Step title="Telefon verbinden">
    Öffnen Sie in der mobilen OpenClaw-App **Settings** → **Gateway** und scannen Sie den QR-Code. Alternativ können Sie den Einrichtungscode kopieren und einfügen.
  </Step>
  <Step title="Verbindung bestätigen">
    Die offizielle iOS-/Android-App stellt die Verbindung automatisch her. Wenn unter **Pending approval** eine Anfrage angezeigt wird, prüfen Sie deren Rolle und Berechtigungsbereiche, bevor Sie sie genehmigen.
  </Step>
</Steps>

Zum Erstellen eines Einrichtungscodes ist `operator.admin` erforderlich; für Sitzungen ohne diese Berechtigung ist die Schaltfläche deaktiviert. Ein Einrichtungscode enthält kurzlebige Bootstrap-Anmeldedaten. Behandeln Sie daher den QR-Code und den kopierten Code wie ein Passwort, solange sie gültig sind. Für die Remote-Kopplung muss das Gateway zu `wss://` aufgelöst werden (beispielsweise über Tailscale Serve/Funnel); einfaches `ws://` ist auf Loopback- und private LAN-Adressen beschränkt. Vollständige Informationen zu Sicherheit und Ausweichverfahren finden Sie unter [Kopplung](/de/channels/pairing#pair-from-the-control-ui-recommended).

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine persönliche Identität pro Browser (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen beigefügt wird. Sie befindet sich im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normalen Autorenmetadaten des Transkripts für von Ihnen gesendete Nachrichten hinaus gespeichert. Durch das Löschen der Websitedaten oder einen Browserwechsel wird sie geleert.

Das Überschreiben des Assistenten-Avatars folgt demselben browserlokalen Muster: Hochgeladene Überschreibungen überlagern lokal die vom Gateway ermittelte Identität und werden niemals über `config.patch` übertragen. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` steht weiterhin für Nicht-UI-Clients zur Verfügung, die das Feld direkt schreiben.

## Endpunkt für die Laufzeitkonfiguration

Die Control UI ruft ihre Laufzeiteinstellungen von `/control-ui-config.json` ab, relativ zum Basispfad der Control UI des Gateways aufgelöst (beispielsweise `/__openclaw__/control-ui-config.json` unter dem Basispfad `/__openclaw__/`). Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung wie die übrige HTTP-Oberfläche geschützt: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert ein gültiges Gateway-Token/-Passwort, eine Tailscale-Serve-Identität oder eine Identität eines vertrauenswürdigen Proxys.

## Status des Gateway-Hosts

Öffnen Sie **Settings → General**, um die Karte **Gateway Host** mit Gateway-Computer, LAN-Adresse, Betriebssystem, Laufzeit, Betriebszeit, CPU-Auslastung, Arbeitsspeicher und Speicherplatz des Zustandsvolumes anzuzeigen. Solange die Karte sichtbar ist, wird sie alle 10 Sekunden über den Gateway-RPC `system.info` aktualisiert, der den Berechtigungsbereich `operator.read` erfordert. Bei älteren Gateways und Verbindungen ohne diesen Berechtigungsbereich wird die Karte nicht angezeigt.

## Sprachunterstützung

Die Control UI lokalisiert sich beim ersten Laden anhand des Gebietsschemas Ihres Browsers. Um es später zu überschreiben, öffnen Sie **Settings -> General -> Language** (die Auswahl befindet sich auf der Seite General, nicht unter Appearance).

- Unterstützte Gebietsschemas: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Nicht englische Übersetzungen werden im Browser verzögert geladen.
- Das ausgewählte Gebietsschema wird im Browserspeicher gespeichert und bei zukünftigen Besuchen erneut verwendet.
- Fehlende Übersetzungsschlüssel greifen auf Englisch zurück.

Dokumentationsübersetzungen werden für dieselben nicht englischen Gebietsschemas generiert. Die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite führt jedoch nur Gebietsschemacodes auf, die Mintlify akzeptiert. Die thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repository generiert; möglicherweise wird sie in dieser Auswahl erst angezeigt, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemen

Das Fenster „Appearance“ enthält die integrierten Themen Claw, Knot und Dash (Claw ist der Standard) sowie einen browserlokalen Importplatz für tweakcn. Um ein Thema zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Thema, klicken Sie auf **Share** und fügen Sie den kopierten Link unter Appearance ein. Der Import unterstützt außerdem Registrierungs-URLs vom Typ `https://tweakcn.com/r/themes/<id>`, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade vom Typ `/themes/<id>`, unverarbeitete Themen-IDs und Namen von Standardthemen wie `amethyst-haze`.

Importierte Themen werden ausschließlich im aktuellen Browserprofil gespeichert; sie werden weder in die Gateway-Konfiguration geschrieben noch geräteübergreifend synchronisiert. Beim Ersetzen des importierten Themas wird der eine lokale Platz aktualisiert; wenn Sie ihn leeren, wird wieder zu Claw gewechselt, sofern das importierte Thema aktiv war.

Unter Appearance gibt es außerdem die Einstellung „Text size“. Sie gilt für Chattext, Editor-Text, Werkzeugkarten und Chat-Seitenleisten und legt für Texteingabefelder mindestens 16px fest, damit mobiles Safari beim Fokussieren nicht automatisch zoomt.

Design, Designmodus, Textgröße, Sprache und Einstellungen für die Chatdarstellung werden über die Gateway-Konfiguration (`ui.prefs`) synchronisiert, sodass sie Ihnen geräteübergreifend folgen und Agenten sie über die Genehmigungsschranke ändern können — verbundene Clients wenden Änderungen über die `config.changed`-Benachrichtigung des Gateways sofort an. Jeder Browser hält für einen sofortigen Start eine lokale Kopie vor; Clients, die die Konfiguration nicht schreiben können (Betrachterbereich, offline), behalten Änderungen nur lokal auf dem Gerät. Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference#ui).

## OpenClaw-Systempflege

Öffnen Sie **Einstellungen → OpenClaw fragen**, um mit dem Agenten für Systemeinrichtung und -reparatur zu sprechen. Außerhalb des Onboardings kann diese Seite pro Besuch höchstens einen ausblendbaren Ereignis-Chip anzeigen. Bei routinemäßigem Gateway-Datenverkehr bleibt sie stumm und reagiert nur auf Zustandsübersichten, die einen deaktivierten Konfigurations-Neulader, eine Trennung oder Beeinträchtigung eines konfigurierten Kanals, eine fehlgeschlagene Kanalprüfung oder nicht verfügbare Kanal-Anmeldedaten melden. Ein neueres Ereignis ersetzt den ausstehenden Chip nur, wenn es schwerwiegender ist; durch das Ausblenden oder Verwenden des Chips werden Ereignisaufforderungen für diesen Besuch unterdrückt. Beim Klicken auf den Chip wird dessen Diagnosefrage als echte `openclaw.chat`-Nachricht gesendet, sodass das Transkript die Anfrage aufzeichnet und OpenClaw die Diagnose durchführt. Beim Onboarding werden diese Ereignis-Chips nie angezeigt.

## Plugins verwalten

Öffnen Sie **Plugins** in der Seitenleiste oder verwenden Sie `/settings/plugins` relativ zum
konfigurierten Basispfad der Control UI, um Plugins zu durchsuchen und zu verwalten, ohne
die Control UI zu verlassen. Beispielsweise verwendet der Basispfad `/openclaw`
`/openclaw/settings/plugins`. Die Seite ist immer verfügbar, selbst wenn jedes
optionale Plugin deaktiviert ist.

Plugins ist eine Zentrale mit vier Registerkarten: **Installiert** und **Entdecken** verwalten Plugin-
Code unter `/settings/plugins`, **Skills** enthält die agentenspezifische Skill-Verwaltung unter
`/skills`, und **Werkstatt** enthält die Prüfung von Skill-Workshop-Vorschlägen unter
`/skills/workshop`. Jede Registerkarte behält ihre eigene URL, und die Seitenleiste zeigt den
einzelnen Eintrag Plugins für alle Registerkarten an.

Die Registerkarte **Installiert** zeigt den vollständigen lokalen Bestand nach Kategorie gruppiert
mit Übersichtszahlen. Jede Zeile öffnet eine Detailansicht; über das Überlaufmenü (`…`)
kann das Plugin aktiviert oder deaktiviert werden, und für extern installierte Plugins steht **Entfernen** zur Verfügung.
Außerdem werden konfigurierte [MCP-Server](/de/cli/mcp) aufgelistet, die direkt hinzugefügt, deaktiviert
und entfernt werden können. Dieselben Serversteuerelemente finden Sie unter **Einstellungen → MCP**.
Die Registerkarte **Entdecken** ist der Store: hervorgehobene, in OpenClaw enthaltene Plugins,
offizielle externe Plugins und MCP-Konnektoren mit Ein-Klick-Installation für beliebte Dienste.
Eine Eingabe in das Suchfeld durchsucht
[ClawHub](https://clawhub.ai/plugins) direkt und fügt einen Abschnitt **Von ClawHub**
mit Downloadzahlen und Kennzeichnungen zur Quellüberprüfung hinzu. Deep Links können
mit `/settings/plugins?tab=discover` direkt auf den Store verweisen.

Die Registerkarte **Skills** enthält den Skill-Statusbericht, Schalter zum Aktivieren und Deaktivieren, die Eingabe von API-
Schlüsseln und die direkte Suche nach ClawHub-Skills, jeweils beschränkt auf den ausgewählten Agenten. Die
Registerkarte **Werkstatt** enthält das Skill-Workshop-Board und den heutigen Prüfablauf für
[Skill-Vorschläge](/de/tools/skill-workshop). **Skill-Ideen finden** prüft ein begrenztes
Fenster substanzieller Sitzungen von der neuesten bis zur ältesten und hinterlässt alle Ergebnisse als
ausstehende Vorschläge. Der Bereich zeigt die kumulative Abdeckung; **Frühere Arbeit durchsuchen**
setzt die Suche ab dem gespeicherten Cursor fort und wird zu **Neue Arbeit durchsuchen**, nachdem der ältere
Verlauf vollständig verarbeitet wurde. Die manuelle Verlaufsprüfung funktioniert, während autonomes Selbstlernen
deaktiviert ist, und verwendet das konfigurierte Modell des ausgewählten Agenten.

Enthaltene Plugins sind bereits auf dem Gateway vorhanden und zeigen **Aktivieren** oder
**Deaktivieren** statt **Installieren** an. Workboard ist beispielsweise in
OpenClaw enthalten, aber standardmäßig deaktiviert, sodass die Aktion **Aktivieren** lautet. Gebündelte Plugins
können nicht entfernt, sondern nur deaktiviert werden.

Das Lesen des Katalogs und die Suche in ClawHub erfordern `operator.read`. Das Installieren,
Aktivieren, Deaktivieren oder Entfernen eines Plugins sowie das Ändern von MCP-Servern erfordern
`operator.admin`; für Bediener mit schreibgeschütztem Zugriff bleiben diese Aktionen deaktiviert.

ClawHub-Installationen werden über das Gateway ausgeführt und unterliegen denselben Prüfungen der Vertrauenswürdigkeit, Integrität
und Plugin-Installationsrichtlinie wie andere durch das Gateway vermittelte Installationen. Das Installieren
oder Entfernen von Plugin-Code erfordert einen Neustart des Gateways. Das Aktivieren oder Deaktivieren eines
installierten Plugins kann ohne Neustart angewendet werden, wenn das Plugin und die aktuelle
Gateway-Laufzeit dies unterstützen; andernfalls meldet die UI, dass ein Neustart
erforderlich ist. OAuth-gestützte MCP-Konnektoren benötigen nach dem Hinzufügen einmalig
`openclaw mcp login <name>` über die CLI.

Die Seite konzentriert sich bewusst auf Bestand, Entdeckung, Installation, Aktivierung
und Entfernung. Verwenden Sie [`openclaw plugins`](/de/cli/plugins) für beliebige npm-, Git- oder
lokale Pfadquellen, Aktualisierungen und erweiterte Plugin-Konfiguration.

## Apps und Erweiterungen

Öffnen Sie **Apps** über das Menü **Mehr** in der Seitenleiste, die Befehlspalette oder das
Agentenmenü der Seitenleiste (**Apps herunterladen**), oder verwenden Sie `/apps` relativ zum
konfigurierten Basispfad der Control UI. Die Seite enthält Installationslinks für jede
OpenClaw-Begleitoberfläche: die [iOS](/de/platforms/ios)- und
[Android](/de/platforms/android)-Apps, die darin enthaltenen Begleit-Apps für Apple Watch und Wear OS,
die Desktop-Apps für [macOS](/de/platforms/macos), [Windows](/de/platforms/windows)
und [Linux](/de/platforms/linux), die
[Chrome-Erweiterung](/de/tools/chrome-extension), die integrierte Plugins-Zentrale mit
[ClawHub](https://clawhub.ai) sowie die Discord-Community und die Dokumentation.

## Navigation in der Seitenleiste

Die Seitenleiste organisiert alles rund um den Agenten. Die Identitätszeile oben zeigt den aktiven Agenten; darunter beginnt der Abschnitt **Seiten** mit **Startseite** — der fortlaufenden Hauptsitzung des Agenten, versehen mit einer Kennzeichnung für den ungelesenen oder laufenden Zustand — gefolgt von den angehefteten Zielen (standardmäßig **Automatisierungen** und **Plugins**). Das Steuerelement zum Anpassen in der Kopfzeile von Seiten öffnet ein Menü mit allen weiteren Zielen, darunter **Nutzung** und von Plugins bereitgestellte Registerkarten, sowie **Angeheftete Elemente bearbeiten**; durch einen Rechtsklick auf den Navigationsbereich wird der Editor für angeheftete Elemente direkt geöffnet. Die darunterliegende Sitzungsliste ist in Bereiche unterteilt: **Threads** für die Chatsitzungen des Agenten (die Hauptsitzung bleibt hinter der Startseite; von ihr gestartete Sitzungen erscheinen hier als Threads der obersten Ebene, und benannte Threads werden ohne Typpräfix angezeigt), **Gruppen** für Gruppen- und Raumunterhaltungen und **Programmierung** für Sitzungen, die an einen verwalteten Worktree oder eine Ausführungs-Node gebunden sind (Zeilen zeigen eine `repo ⎇ branch`-Zeile sowie den Node-Host), ACP-gestützte Harness-Sitzungen und die Codex-/Claude-CLI-Kataloge. Programmierung ist beim ersten Start eingeklappt und merkt sich Ihre Auswahl; die eingeklappte Kopfzeile behält die tatsächliche Anzahl bei und zeigt einen Aktivitätsindikator, während enthaltene Sitzungen arbeiten. Benutzerdefinierte Gruppen (die Sitzungs-`category`) und **Angeheftet**-Zeilen stehen oberhalb von Threads, und die Zuordnung einer Sitzung zu einer benutzerdefinierten Gruppe hat immer Vorrang vor der automatischen Bereichsklassifizierung. Die Kopfzeile von Threads enthält die Sortiersteuerung (Erstellt oder Zuletzt aktualisiert, Gruppieren nach sowie einen gespeicherten **Status**-Filter für Aktiv, Archiviert oder Alle) und das **+**, das die Seite Neue Sitzung öffnet. Archivierte Zeilen bleiben direkt in der Liste, abgeblendet und mit einem Archivsymbol; sie tragen nicht zum ungelesenen Zustand oder Aufmerksamkeitsstatus bei und bleiben von der Abstammungs-Hervorhebung ausgeschlossen. Beim Öffnen einer Sitzung wird die Auswahlmarkierung verschoben, ohne die Zeilen neu zu ordnen. Übergeordnete Sitzungen mit kürzlich ausgeführten untergeordneten Läufen zeigen ein Aufklappsymbol und die Anzahl der untergeordneten Sitzungen; klappen Sie den Eintrag auf, um verschachtelte untergeordnete Sitzungen, ihren aktiven oder beendeten Status und die Laufzeit zu prüfen, ohne die Seitenleiste zu verlassen. Durch die Auswahl einer untergeordneten Sitzung wird ihr Chat geöffnet und ihr Vorfahrenpfad automatisch eingeblendet. Untergeordnete Zeilen bleiben von Stammgruppierung, Anheften, Ziehen, Mehrfachauswahl und Seitennavigation ausgeschlossen; eingeklappte Bereiche verbrauchen das sichtbare Seitenbudget nicht. Sitzungen mit neuen Aktivitäten seit dem letzten Lesen zeigen einen Punkt für ungelesene Inhalte, und beim Öffnen werden sie als gelesen markiert. Ein Agent kann außerdem eine kurze, zeitlich begrenzte Statuszeile veröffentlichen und optional mit einem ausgewählten bernsteinfarbenen Symbol um Aufmerksamkeit bitten; diese Angabe wird gelöscht, wenn Sie die Sitzung öffnen, die nächste Nachricht senden, sie ausdrücklich löschen oder ihre TTL abläuft. Lebenszykluszustände von Cloud-Workern verwenden eine Globus-Kennzeichnung; lokale und zurückgeholte Sitzungen zeigen keine Platzierungskennzeichnung, da die lokale Ausführung der Standard ist. Jede Stammsitzungszeile verfügt über ein Kontextmenü (Dreipunkt-Schaltfläche oder Rechtsklick) mit Anheften/Lösen, Als ungelesen/gelesen markieren, Umbenennen, Forken, In Gruppe verschieben (einschließlich Neue Gruppe und Aus Gruppe entfernen), Archivieren oder Dearchivieren und Löschen; in Touch-Layouts bleiben die direkten Steuerelemente zum Anheften und für das Menü sichtbar. Durch Cmd-/Strg-Klick werden Stammzeilen einer Mehrfachauswahl hinzugefügt oder daraus entfernt, und durch Umschalt-Klick wird die Auswahl über die sichtbare Reihenfolge erweitert; das Öffnen des Menüs in einer ausgewählten Zeile bietet anschließend Stapelaktionen (N als ungelesen/gelesen markieren, N in Gruppe verschieben, N archivieren, N löschen), die auf jede ausgewählte Sitzung angewendet werden, mit einer einzigen Bestätigung für die Stapellöschung. Ziehen Sie eine Stammsitzung auf **Angeheftet**, um sie anzuheften, oder auf eine benutzerdefinierte Gruppe, um sie zu verschieben. Kopfzeilen benutzerdefinierter Gruppen können eingeklappt, ausgeklappt oder zur Neuordnung gezogen werden; Gruppennamen und ihre Reihenfolge werden im Gateway (`sessions.groups.*`) gespeichert, sodass sie Ihnen browserübergreifend folgen, während der eingeklappte Zustand im Browserprofil verbleibt. Gruppenkopfzeilen verfügen außerdem über ein Menü (Dreipunkt-Schaltfläche oder Rechtsklick) mit Gruppe umbenennen, Neue Gruppe und Gruppe löschen; beim Umbenennen oder Löschen einer Gruppe wird jede zugehörige Sitzung serverseitig aktualisiert, einschließlich archivierter Sitzungen. Beim Löschen einer Gruppe bleiben deren Sitzungen erhalten und werden zurück nach Threads verschoben.

## Seite „Neue Sitzung“

Das **+** in der Kopfzeile der Sitzungsliste in der Seitenleiste öffnet unter `/new` einen ganzseitigen Entwurf: Es wird nichts erstellt, bis Sie die erste Nachricht senden. Über eine einheitliche Auswahl **Ort** werden der Arbeitsordner und für Administratoren das Ausführungsziel ausgewählt: **Gateway · lokal**, eine gekoppelte Node, die `system.run` bereitstellt, oder ein verfügbares Cloud-Profil. Der Ordner ist standardmäßig der Arbeitsbereich des Agenten; ein anderer absoluter Gateway-Pfad erfordert `operator.admin`, kann jedoch direkt ausgeführt werden, ohne ein Git-Checkout zu sein. Wenn der ausgewählte Gateway-Ordner ein Git-Checkout ist, bietet dieselbe Auswahl eine optionale **Worktree**-Isolation mit einer durch `worktrees.branches` gestützten Auswahl des Basis-Branches (kein Abruf) und einem optionalen Worktree-Namen (der Branch wird zu `openclaw/<name>`). Cloud-Worker benötigen diesen Pfad eines verwalteten Worktrees; gekoppelte Nodes stellen ihn nie bereit. In der Fußzeile des Editors werden Modell und Reasoning-Stufe der neuen Sitzung ausgewählt. Der Schalter **Inkognito** erstellt einen rein webbasierten Thread, dessen Sitzungseintrag, Transkript und Compaction-Zustand bis zum Neustart des Gateways im Arbeitsspeicher verbleiben; OpenClaw überspringt außerdem die automatische Speicherleerung. Der Agent behält seine normalen Werkzeuge, sodass eine ausdrückliche Speicheranforderung oder ein werkzeuggesteuerter Dateischreibvorgang weiterhin Daten dauerhaft speichern kann. Der Modell-Provider verarbeitet die Nachrichten weiterhin, und inhaltsfreie Audit-Metadaten werden weiterhin aufgezeichnet. Cloud-Starts speichern ihre Modell- und Reasoning-Auswahl, bevor die Sitzung an ihren Worker gesendet wird.

Bei Gateways mit mehreren Benutzern können nur Verbindungen mit Administratorbereich Inkognito-Threads erstellen oder anzeigen, und andere Sitzungen können nicht über Agenten-Sitzungswerkzeuge oder die Transkriptsuche auf sie zugreifen. Inkognito schützt vor Speicherung und anderen durch das Gateway vermittelten Benutzern, nicht vor dem Eigentümer des Gateways oder dem Prozessbetreiber, die aktive Sitzungen jederzeit beobachten können.

**Ordner durchsuchen** öffnet den eingebetteten Verzeichnisbrowser der Ortsauswahl, der durch die ausschließlich Administratoren zugängliche Methode `fs.listDir` gestützt und auf das ausgewählte Gateway oder die ausgewählte Node beschränkt ist. Das Gateway und durchsuchbare Nodes listen ihr Dateisystem auf; eine ausführungsfähige Node ohne `fs.listDir` akzeptiert dennoch einen eingegebenen absoluten Pfad. Zuletzt verwendete Orte können einen Ordner und die zugehörige Node gemeinsam wiederherstellen, ohne Pfade zwischen Hosts zu übertragen. Beim Absenden wird `sessions.create` mit der ersten Nachricht aufgerufen, sodass der Lauf im selben Roundtrip startet und die UI zum Chat der neuen Sitzung wechselt. Wenn das Gateway die Sitzung erstellt, aber das erste Senden ablehnt, bleiben Eingabeaufforderung und Fehler im Chat auch nach einem erneuten Laden erhalten; **Erneut versuchen** sendet die Nachricht über die bereits erstellte Sitzung, statt eine weitere zu erstellen.

Unter **Einstellungen** enthält die eigene Seitenleiste **OpenClaw fragen** und beginnt mit einem Feld **Einstellungen durchsuchen**, über das Einstellungsbereiche schnell gefunden werden können.

Im Desktop-Web enthält eine feste Steuerungsgruppe oben links im Inhaltsbereich — das Web-Gegenstück zur macOS-Titelleistenleiste — den Umschalter zum Einklappen der Seitenleiste (⌘B) und die Suchschaltfläche der Befehlspalette (⌘K). Durch Klicken auf die Agentenidentitätszeile oben in der Seitenleiste wird das Agentenmenü geöffnet; **Startseite** öffnet die Hauptsitzung. Wenn etwas bearbeitet werden muss — fehlgeschlagene oder überfällige Cron-Aufträge, bald ablaufende oder abgelaufene Modellauthentifizierung — erscheinen kompakte Hinweis-Chips oberhalb der Fußzeile der Seitenleiste und führen per Klick zur zuständigen Seite. Die Identitätszeile zeigt den Avatar des Agenten (Identitätsbild oder Emoji), den Namen, den Verbindungsstatuspunkt und einen live aktualisierten Untertitel. Das agentenspezifische Menü enthält den integrierten Agentenumschalter (bei Multi-Agenten-Konfigurationen), **Neuer Agent**, „Was kann dieser Agent?“ und **Agenteneinstellungen**. Bei Listen mit mehr als zehn Agenten wird ein Filterfeld angezeigt und angeheftete Agenten werden zuerst aufgeführt; Agenten lassen sich auf der Einstellungsseite „Agenten“ anheften oder lösen, wobei die angeheftete Auswahl im Browserprofil gespeichert wird. Durch Auswahl eines Agenten werden Chat sowie Nutzung, Automatisierungen, Aufgaben, Arbeitsbereich und Sitzungen auf diesen Agenten beschränkt. Jede entsprechend beschränkte Seite bietet ein Steuerelement **Agent** mit **Alle Agenten** zum Aufheben der Beschränkung; dadurch wird der Bereich der gemeinsam genutzten Seite erweitert, ohne den konkreten Chat-Agenten zu ändern, während direkte Sitzungslinks weiterhin ihr jeweiliges Ziel öffnen. Die Einstellungsseite „Agenten“ behält ihre eigene `?agent=`-Auswahl bei und folgt nicht dem gemeinsamen Seitenbereich. Die Fußzeile besteht aus einer einzigen Identitätskarte über die volle Breite, die auch offline verfügbar bleibt und unter dem zuletzt bekannten Kontonamen **Verbindung wird wiederhergestellt…** anzeigt. Sie öffnet das App-/Kontomenü, in dem auf die Profilidentitäts-Kopfzeile **Einstellungen**, **Nutzung**, die Mobilgeräte-Kopplung, **Apps herunterladen**, **Hilfe** (Hilfe, Discord, Dokumentation und Änderungsprotokoll), bei Bedarf eine Offline-Wiederholungsaktion, der Versions-/Build-Chip und der Umschalter für den Farbmodus folgen. Der Build-Chip öffnet die Seite „Über“. Wenn das Gateway aus einem Quellcode-Checkout auf einem anderen Branch als `main` ausgeführt wird, zeigt die Fußzeile diesen Branch-Namen zusätzlich rot an, sodass ein Nicht-Release-Gateway auf einen Blick erkennbar ist (bei Release-Installationen wird er nie angezeigt). Umschalt-Befehl-Komma auf Apple-Plattformen beziehungsweise Strg-Umschalt-Komma auf anderen Plattformen öffnet **Einstellungen**, ohne das einfache Befehl-Komma-Tastenkürzel des Browsers zu überschreiben. Beim Einklappen der Seitenleiste (⌘B oder der Umschalter der Steuerungsgruppe) wird sie vollständig ausgeblendet, sodass ein Arbeitsbereich über die volle Breite entsteht; im eingeklappten Zustand behält die Steuerungsgruppe oben links den Ausklappumschalter und die Suche bei und erhält zusätzlich eine Schaltfläche für einen neuen Thread — entsprechend den Steuerelementen, die die macOS-App nativ in ihrer Titelleiste bereitstellt. Die Seitenleiste ist auf dem Desktop das einzige Navigationselement; eine obere Leiste gibt es nicht. Bei schmalen Ansichtsbereichen wird die Seitenleiste durch einen ausfahrbaren Drawer hinter einer kompakten Kopfzeile ersetzt, die den Drawer-Umschalter, die Marke und die Suche der Befehlspalette enthält; auf Smartphones integriert Chat diese Navigationszeile in seine Titelleiste, wobei sich die Menü- und Suchsteuerelemente neben dem Sitzungstitel befinden. In der macOS-App integriert die separate Kopfzeile den Freiraum der Titelleiste in eine einzige kompakte Leiste neben den Fenstersteuerelementen. Die Navigation verwendet den regulären Browserverlauf, sodass sie mit den Zurück-/Vorwärts-Schaltflächen des Browsers durchlaufen werden kann; die macOS-App ergänzt neben den Fenstersteuerelementen einen nativen Seitenleistenumschalter sowie Trackpad-Wischgesten, bei ausgeklappter Seitenleiste Zurück-/Vorwärts-Schaltflächen an deren rechtem Rand und bei eingeklappter Seitenleiste Schaltflächen für die native Suche (Befehlspalette) und eine neue Sitzung.

Ausstehende Genehmigungen fügen ebenfalls einen Hinweis-Chip oberhalb der Fußzeile der Seitenleiste hinzu;
wählen Sie ihn aus, um die zuständige Genehmigungsseite zu öffnen.

## Was es kann (heute)

<AccordionGroup>
  <Accordion title="Chat und Sprache">
    - Chatten Sie über Gateway WS mit dem Modell (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`). Bei archivierten Sitzungen bleibt der Eingabebereich deaktiviert und ein Banner mit der Aktion **Dearchivieren** wird angezeigt, bevor die Unterhaltung fortgesetzt werden kann.
    - Beim Aktualisieren des Chatverlaufs wird ein begrenztes Fenster der letzten Nachrichten mit Textlimits pro Nachricht angefordert, sodass große Sitzungen den Browser nicht dazu zwingen, vor der Nutzbarkeit des Chats eine vollständige Transkriptnutzlast zu rendern.
    - Wenn der Mauszeiger über einem öffentlichen GitHub-Issue- oder Pull-Request-Link verweilt oder dieser per Tastatur fokussiert wird, werden Status, Titel, Autor, letzte Aktivität, Kommentare und Änderungsstatistiken angezeigt. Das verbundene Gateway ruft öffentliche Metadaten ab und speichert sie im Cache, ohne das Linkziel zu ändern, auch wenn die Benutzeroberfläche ein entferntes Gateway verwendet. Das Gateway verwendet `GH_TOKEN` oder `GITHUB_TOKEN`, sofern verfügbar, nachdem bestätigt wurde, dass das Repository öffentlich ist; andernfalls verwendet es die anonyme API von GitHub mit einer längeren Cache-Dauer.
    - Sprechen Sie über Echtzeitsitzungen im Browser. OpenAI verwendet direktes WebRTC, Google Live verwendet über WebSocket ein eingeschränktes Browser-Token zur einmaligen Verwendung und reine Backend-Plugins für Echtzeitsprache verwenden den Gateway-Relay-Transport. Videofähige Browsersitzungen können in den Einstellungen eine lokale Gerätekamera auswählen oder in der Live-Vorschau zwischen Kameras wechseln; der Browser erfasst JPEG-Frames für den Echtzeit-Provider, ohne Kameravideo über das Gateway zu streamen. Vom Client verwaltete Provider-Sitzungen beginnen mit `talk.client.create`; Gateway-Relay-Sitzungen beginnen mit `talk.session.create`. Das Relay bewahrt die Provider-Anmeldedaten auf dem Gateway auf, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, `openclaw_agent_consult`-Provider-Tool-Aufrufe über `talk.client.toolCall` zur Anwendung der Gateway-Richtlinien und zur Verarbeitung durch das größere konfigurierte OpenClaw-Modell weiterleitet und die Sprachsteuerung aktiver Läufe über `talk.client.steer` oder `talk.session.steer` routet.
    - Streamen Sie Tool-Aufrufe und Live-Ausgabekarten von Tools im Chat (Agentenereignisse). Tool-Aktivitäten werden als nach Art differenzierte Zeilen dargestellt: Shell-Befehle zeigen den syntaxhervorgehobenen Befehl mit einer Ausgabe im Terminalstil; unterstützte Bearbeitungs- und Schreibaufrufe zeigen begrenzte Inline-Diffs, sofern verfügbar Zeilennummern und `+added -removed`-Statistiken; aufeinanderfolgende Aufrufe werden zu einer Zusammenfassung wie „13 Befehle ausgeführt, 6 Dateien gelesen, 9 Dateien bearbeitet“ zusammengefasst. Während ein Lauf aktiv ist, gibt der neueste ausgeführte Aufruf der Gruppenkopfzeile ihren Namen. Klappen Sie eine Zeile auf, um die übrigen Argumente und die Rohausgabe zu prüfen.
    - Optionale KI-generierte Zweckbezeichnungen für komplexe Tool-Aufrufe (lange Shell-Befehle, Plugin-Tools mit vielen Argumenten), aktiviert mit `gateway.controlUi.toolTitles: true` (standardmäßig deaktiviert). Die Bezeichnungen stammen über das standardmäßige Utility-Modell-Routing aus der gebündelten Methode `chat.toolTitles` — entweder einem expliziten `utilityModel` (vom Betreiber ausgewählter Provider, wie bei anderen Utility-Aufgaben) oder andernfalls dem deklarierten Standard-Kleinmodell des Sitzungs-Providers — und werden Gateway-seitig pro Agent im Cache gespeichert. Wenn die optionale Funktion deaktiviert ist oder kein kostengünstiges Modell verwendet werden kann, behalten die Zeilen ihre deterministischen Beschriftungen bei und es erfolgt kein Modellaufruf.
    - Starten oder verwerfen Sie temporäre, vom Modell vorgeschlagene Folgeaufgaben; angenommene Vorschläge öffnen eine neue verwaltete Worktree-Sitzung mit dem vorgeschlagenen Prompt.
    - Aktivitätsregisterkarte mit browserlokalen, vorrangig geschwärzten Zusammenfassungen der Live-Tool-Aktivität aus der bestehenden `session.tool`- / Tool-Ereignisübermittlung.

  </Accordion>
  <Accordion title="Kanäle, Sitzungen, Speicher">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und kanalspezifische Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Bei Aktualisierungen durch Kanalprüfungen bleibt der vorherige Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden; teilweise Snapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit sein Zeitbudget für die Benutzeroberfläche überschreitet.
    - Threads (eine Arbeitsbereichsseite unter `/sessions`, mit einer danebenliegenden Registerkarte **Worktrees**): Standardmäßig werden die Sitzungen konfigurierter Agenten aufgelistet; häufig verwendete Sitzungen können angeheftet, umbenannt, archiviert oder bei Inaktivität wiederhergestellt werden, veraltete Sitzungsschlüssel nicht konfigurierter Agenten werden abgefangen und sitzungsspezifische Überschreibungen für Modell/Denken/Schnell/Ausführlich/Trace/Reasoning können angewendet werden (`sessions.list`, `sessions.patch`). Ein dreistufiger Filter **Aktiv / Archiviert / Alle** steuert sowohl diese Seite als auch die Seitenleiste; bei „Alle“ werden archivierte Zeilen abgeblendet und ausdrücklich gekennzeichnet. Archivierte Sitzungen behalten ihre Transkripte, werden nie automatisch bereinigt und bleiben zurückgestellt, bis sie ausdrücklich dearchiviert oder gelöscht werden. Zeilen zeigen bei aktiven Sitzungen mit Aktivitäten seit dem letzten Lesen einen Punkt für ungelesene Inhalte sowie Aktionen zum Markieren als ungelesen/gelesen (`sessions.patch { unread }`) und eine Fork-Aktion, die das Transkript in eine neue Sitzung verzweigt (`sessions.create { parentSessionKey, fork: true }`). Übersichtskacheln oberhalb der Tabelle fassen die geladene Liste zusammen (Anzahl der Sitzungen, aktive Läufe, ungelesene Sitzungen, Gesamtzahl der Token und, sofern verfügbar, Anzahl der archivierten Sitzungen); jede Zeile enthält ein Symbol für die Art mit einem Punkt für einen aktiven Lauf, der Status wird als einfacher Punkt mit Beschriftung dargestellt und die Spalte „Token“ zeigt eine Auslastungsanzeige des Kontextfensters, wenn die Sitzung Token- und Kontextgrößen meldet. Verwaltungsaktionen für Zeilen befinden sich in einem zeilenspezifischen Menü (Dreipunkt-Schaltfläche oder Rechtsklick), das dem Sitzungsmenü der Seitenleiste entspricht; der Zeilen-Drawer zeigt neben den anderen Sitzungsdetails auch die Agentenlaufzeit und die Dauer des Laufs.
    - Native Seitenleistenkataloge von Claude und Codex streamen jeweils einen Host und werden anschließend nach Änderungen der Node-Konnektivität, beim Fokussieren der Seite und bei sichtbarer Seite höchstens alle 30 Sekunden abgeglichen. Katalogänderungen lösen einen schnelleren Folgedurchlauf aus, sodass in den nativen Tools erstellte Sitzungen ohne Neuladen der Control UI erscheinen. Zeilen von Claude Desktop behalten außerdem, sofern vorhanden, die lokale benutzerdefinierte Gruppenbeschriftung bei; OpenClaw liest diese Zuordnung aus dem lokalen Speicher von Desktop und schreibt nie dorthin.
    - Sitzungsgruppierung: Ein Steuerelement „Gruppieren nach“ ordnet die Sitzungstabelle nach benutzerdefinierten Gruppen, Kanal, Art, Agent oder Datum in Abschnitte. Benutzerdefinierte Gruppen werden pro Sitzung über `sessions.patch` (`category`) gespeichert, sodass auch Sitzungen kategorisiert werden können, die über Nachrichtenkanäle (Discord, Telegram, WhatsApp, ...) gestartet wurden; weisen Sie Gruppen zu, indem Sie Zeilen auf einen Abschnitt ziehen oder die zeilenspezifische Gruppenauswahl verwenden, und erstellen Sie Gruppen mit der Aktion „Neue Gruppe“.
    - Speicher (eine Registerkarte auf der Seite „Agenten“, beschränkt auf den ausgewählten Agenten): Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Leser für das Traumtagebuch (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Speicher importieren (`/memory-import`, erreichbar über die Registerkarte „Speicher“ auf der Seite „Agenten“): Zeigen Sie lokale Dateien aus dem automatischen Speicher von Claude Code, dem konsolidierten Speicher von Codex oder dem Hermes-Speicher in der Vorschau an und kopieren Sie sie in den ausgewählten Agentenarbeitsbereich (`migrations.memory.plan`, `migrations.memory.apply`).
    - Speicherangebot beim Onboarding: Wenn die Control UI im Onboarding-Modus geöffnet wird (`?onboarding=1`, von der Linux-Begleit-App nach der Erstinstallation verwendet), bietet ein einseitiger Dialog an, erkannte Speicher mit demselben Plan-/Anwendungsablauf zu importieren; beim Überspringen bleibt die Einstellungsseite als späterer Einstiegspunkt verfügbar.

  </Accordion>
  <Accordion title="Cron, Aufgaben, Plugins, Skills, Geräte, Ausführungsgenehmigungen">
    - Automatisierungen (Cron-Jobs): Statistikkarten (Anzahl der Automatisierungen, Anzahl der fehlgeschlagenen Automatisierungen, Scheduler-Status, nächster Aktivierungszeitpunkt) über einem Tab-Umschalter für Automatisierungen/Ausführungsverlauf; der Tab „Automatisierungen“ führt Jobs in einer filterbaren Tabelle auf (Alle/Aktiv/Pausiert, Suche, Zeitplan- und Filter für die letzte Ausführung, Aktionsmenü pro Zeile), darunter werden Vorschläge für den Einstieg angezeigt, und der Tab „Ausführungsverlauf“ zeigt die letzten Ausführungen aller Automatisierungen (`cron.*`).
    - Aufgaben: Live-Verzeichnis aktiver und kürzlich ausgeführter Hintergrundaufgaben mit verknüpften Sitzungen und Abbruchmöglichkeit (`tasks.*`). Die Seitenleiste „Hintergrundaufgaben“ im Chat gruppiert laufende und abgeschlossene Arbeiten; wählen Sie eine Zeile aus, um den abgegrenzten Prompt und die Ausgabe oder Fehlerzusammenfassung zu prüfen.
    - Plugins: Durchsuchen Sie das installierte Inventar und den kuratierten Store, durchsuchen Sie ClawHub, installieren und entfernen Sie Plugin-Code und aktivieren oder deaktivieren Sie installierte Plugins (`plugins.*`); in MCP-Serverzeilen wird `mcp.servers` über die Konfigurationsmethoden bearbeitet.
    - Skills: Status, Aktivierung/Deaktivierung, Installation, Aktualisierungen von API-Schlüsseln (`skills.*`).
    - Geräte: Ein gemeinsames Inventar vereint Datensätze gekoppelter Geräte, den Node-Katalog und die Live-Präsenz (`device.pair.list`, `node.list`, `system-presence`). Der Gateway-Host wird an erster Stelle fixiert; gekoppelte Clients zeigen Verbindungsstatus, Rollen, Token, Fähigkeiten und Befehle. Doppelte Kopplungen werden zu einer ausklappbaren Gruppe zusammengefasst, und **N veraltete Einträge bereinigen** entfernt nach Admin-Bestätigung gesammelt Offline-Duplikate, die automatisch genehmigt wurden (stilles lokales Verfahren, vertrauenswürdiger CIDR-Bereich oder SSH-Verifizierung) oder aus einer Zeit vor der Erfassung der Genehmigungsherkunft stammen. Einträge können entfernt werden (`node.pair.remove`, `device.pair.remove`), Gerätekopplungen und erneute Node-Genehmigungen werden direkt bearbeitet (`device.pair.*`, `node.pair.approve`/`reject`), und Einrichtungscodes für Mobilgeräte werden auf derselben Karte erstellt.
    - Ausführungsgenehmigungen: Bearbeiten Sie Gateway- oder Node-Zulassungslisten und die Rückfragerichtlinie für `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Die Einstellungsnavigation beginnt mit „OpenClaw fragen“ und gruppiert die Seiten anschließend nach Relevanz: „Allgemein“, „Darstellung“ und „Benachrichtigungen“ oben; „Verbindungen“ (Verbindung, Kanäle, Kommunikation, Geräte); „Agenten und Tools“ (Agenten, KI und Agenten, Modell-Provider, MCP, Automatisierung, Labs); „Datenschutz und Sicherheit“ (Sicherheit, Genehmigungen); und „System“ (Infrastruktur, Erweitert, Debugging, Protokolle, Info). „Allgemein“ ist eine kompakte Übersichtsseite mit Modellstandards, Sprache und Statistiken zum Gateway-Host; jede andere Einstellung befindet sich auf genau einer Seite.
    - Datenschutz und Sicherheit: Kuratierte Zeilen für Gateway-Authentifizierung, Ausführungsrichtlinie, Browseraktivierung, Tool-Profil, Geräteauthentifizierung und Mobilgerätekopplung über den schemabasierten Abschnitten `security`/`approvals`.
    - „Genehmigungen“ enthält einen nach Aktualität absteigend sortierten 30-Tage-Verlauf erledigter Ausführungs-, Plugin- und Systemagentenanfragen. Filtern Sie nach Typ oder blättern Sie durch ältere Zeilen, um die vom Gateway aufgezeichnete Entscheidung, Begründung, Quellsitzung und Zuordnung der entscheidenden Person zu prüfen.
    - „Labs“ stellt ausgelieferte experimentelle Schalter bereit. „Code Mode“ und „Swarm“ sind die aktuellen Einträge und speichern `tools.codeMode.enabled` beziehungsweise `tools.swarm.enabled` sofort; nicht ausgelieferte Experimente werden weder angezeigt noch schreiben sie spekulative Konfigurationsschlüssel.
    - Benachrichtigungen: Status der Browser-Web-Push-Benachrichtigungen, Abonnieren/Abbestellen und Testversand.
    - Erweitert: Jeder Konfigurationsabschnitt ohne kuratierten Hauptbereich sowie der JSON5-Roheditor (zuvor der erweiterte Modus der Seite „Allgemein“).
    - „Modelleinrichtung“ (`/settings/model-setup`) ist eine Unterseite von „Modell-Provider“, die über deren Kopfzeile geöffnet wird.
    - Agenten: Eine Einstellungsseite (**Einstellungen → Agenten**, `/settings/agents`) mit Tabs pro Agent (Übersicht, Dateien, Tools, Skills, Kanäle, Automatisierungen, Memory). Im Tab „Übersicht“ wird die Identität des Agenten bearbeitet – Anzeigename, Emoji und ein Avatarbild, das im Browser vor `agents.update` herunterskaliert und auf eine maximale Größe begrenzt wird. Beim Speichern werden die konfigurierten Identitätsfelder gespeichert und in `IDENTITY.md` des Workspace gespiegelt; konfigurierte Werte haben Vorrang vor manuellen Änderungen derselben Dateifelder.
    - Profil: Eine Einstellungsseite, die die Identität des Standardagenten zusammen mit Nutzungsstatistiken für den gesamten Zeitraum zeigt – Token über die gesamte Lebensdauer, Spitzentag, längste Sitzung, Aktivitätsserien, eine Token-Heatmap über ein Jahr, meistgenutzte Tools und Kanal-Highlights (`usage.cost`, `sessions.usage`).
    - MCP verfügt über eine eigene Einstellungsseite mit Serverzeilen (Transport, Aktivierungsstatus, Zusammenfassungen zu OAuth/Filtern/Parallelität), direkten Steuerelementen zum Hinzufügen/Aktivieren/Deaktivieren/Entfernen, gängigen Operatorbefehlen und dem bereichsspezifischen Konfigurationseditor `mcp`. Die Seite „Plugins“ bleibt der zentrale Ort für Konnektoren mit nur einem Klick und die Erkennung.
    - Modell-Provider: Eine Einstellungsseite, die jeden konfigurierten Modell-Provider mit seinem Markensymbol, Authentifizierungsstatus (`models.authStatus`), der Modellverfügbarkeit (`models.list`), Live-Daten zu Tarif/Kontingent/Abrechnung, sofern der Provider diese meldet (`usage.status`), und lokalen Sitzungsausgaben der letzten 30 Tage (`sessions.usage`) aufführt. Mit der Aktion „Aktualisieren“ werden der Anmeldedatenstatus und die Provider-Nutzung erneut eingelesen.
    - Verbindung: Eine Einstellungsseite (unter **Verbindungen**) für die Gateway-Verbindung des Dashboards selbst – WebSocket-URL, Gateway-Token, Passwort und Standardsitzungsschlüssel – sowie die Momentaufnahme des letzten Handshakes (Status, Betriebszeit, Tick-Intervall, letzte Kanalaktualisierung). Die Offline-Anmeldesperre behandelt den Fall einer getrennten Verbindung; auf dieser Seite wird die Verbindung im verbundenen Zustand bearbeitet.
    - Mit Validierung anwenden und neu starten (`config.apply`), anschließend die zuletzt aktive Sitzung aktivieren.
    - Schreibvorgänge enthalten eine Prüfung des Basis-Hashs, um das Überschreiben paralleler Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Referenzen in den übermittelten Konfigurationsdaten; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Beim Speichern des Formulars werden veraltete redigierte Platzhalter verworfen, die sich nicht aus der gespeicherten Konfiguration wiederherstellen lassen, während redigierte Werte erhalten bleiben, die weiterhin gespeicherten Geheimnissen zugeordnet sind.
    - Schema und Formulardarstellung stammen aus `config.schema` / `config.schema.lookup`, einschließlich Feld-`title`/`description`, passenden UI-Hinweisen, unmittelbaren Zusammenfassungen untergeordneter Elemente, Dokumentationsmetadaten für verschachtelte Objekt-, Platzhalter-, Array- und Kompositionsknoten sowie Plugin- und Kanalschemata, sofern verfügbar. Der JSON-Roheditor ist nur verfügbar, wenn die Momentaufnahme einen sicheren Rohdaten-Roundtrip ermöglicht; andernfalls erzwingt die Control UI den Formularmodus.
    - „Auf gespeicherten Stand zurücksetzen“ im JSON-Roheditor erhält die im Rohformat erstellte Struktur (Formatierung, Kommentare, `$include`-Layout), anstatt eine abgeflachte Momentaufnahme neu darzustellen. Dadurch bleiben externe Änderungen beim Zurücksetzen erhalten, sofern die Momentaufnahme sicher einen Roundtrip durchlaufen kann.
    - Strukturierte SecretRef-Objektwerte werden in Texteingabefeldern des Formulars schreibgeschützt dargestellt, um eine versehentliche Beschädigung durch die Umwandlung von Objekten in Zeichenfolgen zu verhindern.

  </Accordion>
  <Accordion title="Nutzung">
    - Die aus Sitzungen abgeleitete Analyse von Token und geschätzten Kosten bleibt von der Provider-Abrechnung getrennt.
    - Provider-Karten rufen `usage.status` auf und zeigen die von konfigurierten Provider-Plugins gemeldeten Live-Tarifnamen, Kontingentzeiträume, Guthaben, Ausgaben und Budgets.
    - Ein Fehler bei der Provider-Nutzung blockiert das Sitzungs-/Kostendashboard nicht; nicht verfügbare Provider-Karten zeigen einen eigenen Fehlerstatus.

  </Accordion>
  <Accordion title="Debugging, Protokolle, Aktualisierung">
    - Debugging: Momentaufnahmen zu Status/Systemzustand/Modellen, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Aktualisierungs-/RPC-Zeitmessungen der Control UI, Zeitmessungen für langsame Chat-/Konfigurationsdarstellungen sowie Einträge zur Browser-Reaktionsfähigkeit bei langen Animationsframes oder lang laufenden Aufgaben, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Protokolle: Live-Anzeige der letzten Zeilen aus Gateway-Protokolldateien mit Filter/Export (`logs.tail`).
    - Aktualisierung: Paket-/Git-Aktualisierung mit anschließendem Neustart ausführen (`update.run`) und dabei einen Neustartbericht erstellen; danach nach dem erneuten Verbinden `update.status` abfragen, um die Version des laufenden Gateway zu überprüfen.

  </Accordion>
  <Accordion title="Hinweise zum Automatisierungsbereich">
    - Durch Auswahl einer Zeile wird eine ganzseitige Detailansicht geöffnet, deren Kopfzeile einen Aktiv/Pausiert-Schalter und „Jetzt ausführen“ enthält („Ausführen, wenn fällig“, „Klonen“ und „Entfernen“ befinden sich im zugehörigen Menü); im Tab „Einstellungen“ wird die Automatisierung direkt bearbeitet (Prompt, Details, Häufigkeit, erweiterte Überschreibungen), und der Tab „Ausführungsverlauf“ zeigt die Ausführungen dieser Automatisierung.
    - Automatisierungsvorlagen unter der Tabelle füllen das Erstellungsformular mit einem bearbeitbaren Prompt und Zeitplan vorab aus.
    - Bei isolierten Aufgaben wird standardmäßig eine Zusammenfassung angekündigt; wechseln Sie für ausschließlich interne Ausführungen zu „Keine“.
    - Kanal-/Zielfelder werden angezeigt, wenn „Ankündigen“ ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"`, wobei `delivery.to` auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Aufgaben der Hauptsitzung sind die Zustellmodi „Webhook“ und „Keine“ verfügbar.
    - Zu den erweiterten Bearbeitungsoptionen gehören „Nach Ausführung löschen“, „Agentenüberschreibung löschen“, Optionen für exakte/zeitversetzte Cron-Ausführung, Überschreibungen für Agentenmodell/Reasoning und Schalter für Best-Effort-Zustellung.
    - Die Formularvalidierung erfolgt direkt mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert wurden.
    - Setzen Sie `cron.webhookToken`, um ein dediziertes Bearer-Token zu senden; wird es ausgelassen, wird der Webhook ohne Authentifizierungsheader gesendet.
    - `cron.webhook` ist ein eingestellter Legacy-Fallback, der von der aktuellen Konfigurationsvalidierung abgelehnt wird. Führen Sie `openclaw doctor --fix` aus, um gespeicherte Jobs, die noch `notify: true` verwenden, auf eine explizite Webhook- oder Abschlusszustellung pro Job zu migrieren und den alten Schlüssel zu entfernen.

  </Accordion>
</AccordionGroup>

## Assistenten-Memory importieren

Öffnen Sie **Einstellungen** → **Memory importieren**, um lokales Memory von Codex oder Claude Code
in einen OpenClaw-Agenten zu übernehmen. Das Gateway erkennt unterstütztes lokales Memory selbstständig
auf seinem Host, sodass eine entfernte Control UI vom Gateway-Computer und nicht vom
Browser-Computer importiert.

1. Wählen Sie den Zielagenten aus.
2. Prüfen Sie die erkannten Quellsammlungen und Markdown-Dateinamen. Dateiinhalte
   werden weder in der Planantwort gesendet noch auf der Seite angezeigt.
3. Wählen Sie die zu importierenden Sammlungen aus und bestätigen Sie. Beim Anwenden wird der Plan vor dem
   Schreiben neu erstellt, sodass veraltete Auswahlen sicher fehlschlagen.
4. Wenn Dateien bereits vorhanden sind, aktivieren Sie **Vorhandene Importe ersetzen**, aktualisieren Sie die
   Vorschau und bestätigen Sie das Ersetzen.

Codex importiert nur seine konsolidierten Dateien `MEMORY.md` und `memory_summary.md`. Claude
Code importiert Markdown aus den automatischen Memory-Verzeichnissen von Projekten und einem konfigurierten
`autoMemoryDirectory`; Sitzungen, Einstellungen, Anweisungen oder
Anmeldedaten werden über diese Seite nicht importiert. Dateien werden im ausgewählten
Workspace unter `memory/imports/` kopiert, wo das aktive Memory-Plugin sie indizieren kann. Quellen werden
niemals verändert.

Planung und Anwendung erfordern `operator.admin`. Bei jeder Anwendung wird ein verifiziertes
OpenClaw-Backup erstellt, sofern ein Zustand vorhanden ist, ein redigierter Migrationsbericht geschrieben und
vor dem Ersetzen vorhandener Zieldateien werden Sicherungskopien der einzelnen Elemente aufbewahrt. Unter
[Memory-Übersicht](/de/concepts/memory#import-from-coding-assistants) finden Sie Informationen zu Pfaden und
Abrufverhalten.

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operatoransicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet MCP-Transporte nicht selbstständig; verwenden Sie sie, um gespeicherte Konfigurationen zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie einen Live-Nachweis des Servers benötigen.

Typischer Ablauf:

1. Öffnen Sie **MCP** über die Seitenleiste.
2. Prüfen Sie die Übersichtskarten auf die Gesamtzahl sowie die Anzahl aktivierter, OAuth-fähiger und gefilterter Server.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierungsstatus, Authentifizierung, Filter, Zeitüberschreitungen und Befehlshinweise.
4. Fügen Sie Server direkt auf der MCP-Seite hinzu, aktivieren oder deaktivieren Sie sie oder entfernen Sie sie. Wählen Sie ausdrücklich Streamable HTTP, SSE oder stdio; stdio-Befehlszeilen akzeptieren in Anführungszeichen gesetzte Argumente, beispielsweise Pfade mit Leerzeichen. Verwenden Sie die Seite **Plugins** für Konnektoren mit nur einem Klick und die Erkennung.
5. Bearbeiten Sie den bereichsbezogenen Konfigurationsabschnitt `mcp` für erweiterte Serverfelder wie Umgebungsvariablen, Arbeitsverzeichnisse, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Toolfilter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern**, um die Konfiguration zu schreiben, oder **Speichern & Veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration übernehmen soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, um statische Diagnosen oder einen Live-Nachweis durchzuführen beziehungsweise die zwischengespeicherte Runtime zu verwerfen.

Die Seite schwärzt URL-ähnliche Werte mit Zugangsdaten vor dem Rendern und setzt Servernamen in Befehlsausschnitten in Anführungszeichen, damit kopierte Befehle auch bei Leerzeichen oder Shell-Metazeichen funktionieren. Vollständige CLI- und Konfigurationsreferenz: [MCP](/de/cli/mcp).

## Registerkarte „Aktivität“

Die Registerkarte „Aktivität“ befindet sich unter **Einstellungen › System** neben „Protokolle“ und „Debuggen“. Sie dient als flüchtiger, browserlokaler Beobachter für Live-Toolaktivitäten und wird aus demselben Gateway-Ereignisstream für `session.tool`-/Tool-Ereignisse abgeleitet, der auch die Toolkarten im Chat speist. Sie fügt keine weitere Gateway-Ereignisfamilie, keinen Endpunkt, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachterstream hinzu.

Aktivitätseinträge enthalten ausschließlich bereinigte Zusammenfassungen und geschwärzte, gekürzte Ausgabevorschauen. Werte von Toolargumenten werden nicht im Aktivitätsstatus gespeichert; die Benutzeroberfläche zeigt an, dass Argumente ausgeblendet sind, und erfasst lediglich die Anzahl der Argumentfelder. Die In-Memory-Liste ist an die aktuelle Browserregisterkarte gebunden, bleibt bei der Navigation innerhalb der Control UI erhalten und wird beim Neuladen der Seite, beim Wechseln der Sitzung oder durch **Leeren** zurückgesetzt.

## Operator-Terminal

Das andockbare Operator-Terminal ist standardmäßig deaktiviert. Legen Sie zum Aktivieren `gateway.terminal.enabled: true` fest und starten Sie den Gateway neu. Das Terminal erfordert eine `operator.admin`-Verbindung und öffnet ein Host-PTY im Arbeitsbereich des aktiven Agenten. Neue Registerkarten verwenden den aktuell ausgewählten Chat-Agenten.

<Warning>
Das Terminal ist eine nicht eingeschränkte Host-Shell und übernimmt die Umgebung des Gateway-Prozesses. Aktivieren Sie es ausschließlich für vertrauenswürdige Operator-Bereitstellungen. OpenClaw verweigert Terminalsitzungen für Agenten mit `sandbox.mode: "all"`; wenn ein aktiver Agent in diesen Modus versetzt wird, werden seine bestehenden und laufenden Terminalsitzungen geschlossen.
</Warning>

Verwenden Sie **Strg + Gravis**, um das Dock ein- oder auszublenden. Das Layout unterstützt das Andocken unten und rechts, passt seine Größe an den Browser-Viewport an und verwaltet mehrere Shell-Registerkarten. Informationen zu `gateway.terminal.enabled` und zur optionalen Überschreibung `gateway.terminal.shell` finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration-reference#gateway).

Vom Eigentümer autorisierte Agenten ohne Sandbox-Einschränkung können das Tool `terminal` für lang andauernde oder interaktive Arbeiten verwenden, die der Operator beobachten soll. Jeder Toolaufruf kann die Gateway-PTYs des jeweiligen Agenten öffnen, lesen, beschreiben, in der Größe ändern, schließen oder auflisten. Neue Sitzungen öffnen standardmäßig eine gleichzeitig verbundene Control-UI-Registerkarte, sodass Agent und Operator dieselbe Ausgabe sehen und beide Eingaben vornehmen oder die Größe ändern können. Der Agentenzugriff ist exakt auf die jeweilige Sitzung beschränkt: Ein Agent kann weder vom Operator erstellte Terminals noch Terminals lesen oder steuern, die von einer anderen Agentensitzung geöffnet wurden.

Ziehen Sie eine oder mehrere Dateien auf das aktive Terminal oder wählen Sie Dateien über die Büroklammer-Schaltfläche aus. OpenClaw stellt jede Datei auf dem Computer bereit, dem das PTY gehört, und fügt an der Cursorposition Shell-konform in Anführungszeichen gesetzte absolute Pfade ein; die Eingabetaste wird niemals betätigt und die Eingabe niemals ausgeführt. Eine kompakte Stapelanzeige zeigt die aktuelle Datei und die Anzahl der abgeschlossenen Übertragungen an. Durch Abbrechen wird der verbleibende Stapel gestoppt, ohne Pfade einzufügen; eine fehlgeschlagene Übertragung bleibt sichtbar, sodass Sie sie ab dieser Datei wiederholen können, ohne bereits abgeschlossene Dateien erneut hochzuladen. Bilder, PDFs, Archive und andere Dateitypen werden bis zu einer Größe von 16 MiB pro Datei akzeptiert. Bereitgestellte Dateien verwenden auf POSIX-Hosts ein privates temporäres Systemverzeichnis (Verzeichnismodus `0700`, Dateimodus `0600`) oder unter Windows ein Verzeichnis innerhalb der ACL-Grenze des Benutzerprofils sowie einen Bereinigungstimer von 24 Stunden. Verschieben oder kopieren Sie daher alle Dateien, die Sie aufbewahren möchten.

Das Einfügen von Pfaden unterstützt PowerShell, `cmd.exe` und erkannte POSIX-Shells (`sh`, Bash, Dash, Ash, Ksh, Zsh und Fish), einschließlich Git Bash unter Windows. Andere Shell-Überschreibungen werden abgelehnt, da ihre Regeln für Anführungszeichen nicht sicher abgeleitet werden können; führen Sie den Gateway innerhalb von WSL aus, um ein natives WSL-Terminal und Linux-Uploadpfade zu erhalten. `cmd.exe`-Pfade, die `%` oder `!` enthalten, werden ebenfalls abgelehnt, da diese Shell die Zeichen selbst innerhalb doppelter Anführungszeichen expandiert.

Codex- und Claude-Code-Sitzungen, die in der Sitzungsseitenleiste erkannt werden, können innerhalb desselben Terminalbereichs in ihrer nativen CLI geöffnet werden. Legen Sie unter **Einstellungen › Chat** für **Codex-/Claude-Threads öffnen in** den Wert **Terminal** fest, damit ein normaler Klick auf eine Zeile `codex resume` oder `claude --resume` öffnet; standardmäßig wird weiterhin die schreibgeschützte OpenClaw-Ansicht verwendet. Das Kontext- oder Dreipunktmenü einer Zeile bietet stets beide Optionen an, und der Kopfbereich der Ansicht enthält **Im Terminal öffnen**, wenn die Sitzung dafür geeignet ist.

Die Eignung wird pro Sitzung und Host bestimmt. Gateway-lokale Sitzungen starten den Provider-eigenen Fortsetzungsbefehl auf dem Gateway-Host. Sitzungen auf gekoppelten Nodes starten einen zulässigen Provider-Befehl auf der besitzenden Node und übertragen ausschließlich Ausgabe-, Eingabe- und Größenänderungsereignisse dieses PTYs; dadurch wird weder eine allgemeine Node-Shell offengelegt noch werden vom Browser bereitgestellte Befehle akzeptiert. Datei-Uploads verwenden den separaten, größenbeschränkten Node-Befehl `terminal.upload` und bleiben an die bereits geöffnete Terminalsitzung gebunden. Genehmigen Sie das Upgrade der Node-Kopplung, wenn dieser Befehl erstmals angezeigt wird. Nodes, die den passenden Befehl zum Fortsetzen des Terminals nicht anbieten, einschließlich eingebetteter Worker-Bridges ohne Duplex-Streaming, stellen weiterhin die Ansicht bereit und zeigen das Öffnen im Terminal als nicht verfügbar an; ältere Nodes können weiterhin ein Terminal ausführen, aber keine hineingezogenen Dateien empfangen.

Verbindungseigene Sitzungen bleiben bei Verbindungsabbrüchen erhalten: Beim Neuladen einer Seite, im Ruhezustand des Laptops oder bei einer kurzzeitigen Netzwerkunterbrechung wird die Sitzung am Gateway getrennt, statt beendet zu werden. Dieselbe Browserregisterkarte verbindet sich nach Wiederherstellung der Verbindung erneut, wobei die jüngste Ausgabe wiedergegeben wird. Getrennte verbindungseigene Sitzungen werden nach `gateway.terminal.detachedSessionTimeoutSeconds` beendet (standardmäßig 300 Sekunden; `0` stellt das Beenden beim Verbindungsabbruch wieder her). Das Verbinden mit einer dieser Sitzungen bleibt eine Übernahme nach Art von tmux.

Agenteneigene Sitzungen sind nicht an eine Browserverbindung gebunden. `terminal.attach` fügt jeden Browser als Betrachter hinzu, ohne die Eigentümerschaft zu übernehmen, und beim Schließen einer Betrachterregisterkarte wird nur dieser Browser getrennt. Das PTY bleibt bestehen, bis der besitzende Agent es schließt, sein Prozess beendet wird, eine Richtlinie es deaktiviert oder der Gateway heruntergefahren wird. `terminal.list` kennzeichnet jeden Eintrag als verbindungs- oder agenteneigen, und `terminal.text` ermöglicht einer Administratorverbindung, die jüngste Klartextausgabe zu lesen, ohne eine Verbindung mit der Sitzung herzustellen.

Das Terminal ist außerdem unter `/?view=terminal` als bildschirmfüllendes, ausschließlich für das Terminal vorgesehenes Dokument verfügbar. Die iOS- und Android-Apps betten diese Seite in ihre Terminalansichten ein und verwenden dabei die gespeicherten Gateway-Zugangsdaten erneut; die Verfügbarkeit unterliegt denselben Prüfungen durch `gateway.terminal.enabled` und `operator.admin`, und die Seite zeigt einen Hinweis an, wenn der verbundene Gateway das Terminal nicht anbietet.

## Browserbereich

Die Control UI enthält einen andockbaren Browserbereich, der den vom Gateway gesteuerten Browser – denselben, den Agenten über das [Browser-Tool](/de/tools/browser-control) steuern – in jedem regulären Webbrowser darstellt; eine native Webview ist nicht erforderlich. Er wird angezeigt, wenn der verbundene Gateway einer `operator.admin`-Verbindung `browser.request` anbietet; die Globus-Schaltfläche in der Arbeitsbereichsleiste des Threads blendet ihn ein oder aus. Der Bereich zeigt eine Live-Momentaufnahme der Seite mit Registerkarten, einer bearbeitbaren URL-Leiste, Zurück-/Vorwärts-/Neuladefunktionen und der Option zum Öffnen im eigenen Browser. Er kann rechts oder unten angedockt werden und leitet Klicks, das Scrollen mit dem Mausrad sowie einfache Tastatureingaben an die entfernte Seite weiter.

Zwei Erfassungsmodi stellen den Seitenkontext für den Agenten zusammen:

- **Kommentieren (Stift)**: Zeichnen Sie freihändige Markierungen über die Seite. **An Chat senden** fügt die Striche in den Screenshot ein, hängt das Bild an den Verfasser des aktiven Chats an und füllt eine Eingabeaufforderung vor, die die Seiten-URL, den Titel und jeden markierten Bereich beschreibt, damit der Agent genau weiß, was Sie eingekreist haben.
- **Untersuchen (Zeiger)**: Bewegen Sie den Mauszeiger über ein Element, um das Element darunter anzuzeigen (Selektor, barrierefreier Name, Rolle, Größe); klicken Sie darauf, um dessen Details zusammen mit einem hervorgehobenen Screenshot über denselben Verfasser-Ablauf zu senden. Untersuchen, Scrollen mit dem Mausrad und Zurück/Vorwärts benötigen `browser.evaluateEnabled` (standardmäßig aktiviert).

Die macOS-App behält ihre native Link-Browser-Seitenleiste für Links bei, die im Dashboard angeklickt werden; der Browserbereich funktioniert dort ebenfalls und ermöglicht auf allen anderen Plattformen das Kommentieren von Seiten.

## Chatverhalten

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` ist **nicht blockierend**: Der Vorgang wird sofort mit `{ runId, status: "started" }` bestätigt, und die Antwort wird über `chat`-Ereignisse gestreamt. Vertrauenswürdige Control-UI-Clients können für die lokale Diagnose außerdem optionale ACK-Zeitmetadaten empfangen.
    - Chat-Uploads akzeptieren Bilder sowie Dateien, die keine Videos sind. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit derselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - `chat.history`-Antworten sind zur Sicherheit der Benutzeroberfläche größenbeschränkt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter (`[chat.history omitted: message too large]`) ersetzen.
    - Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann die Seitenansicht den vollständigen, für die Anzeige normalisierten Transkripteintrag bei Bedarf über `chat.message.get` anhand von `sessionKey`, bei Bedarf der aktiven `agentId` und der Transkript-`messageId` abrufen. Wenn der Gateway weiterhin keine weiteren Inhalte zurückgeben kann, zeigt die Ansicht ausdrücklich den Status „nicht verfügbar“ an, statt stillschweigend die gekürzte Vorschau zu wiederholen.
    - Vom Assistenten erzeugte Bilder werden als verwaltete Medienreferenzen dauerhaft gespeichert und über authentifizierte Gateway-Medien-URLs bereitgestellt, sodass erneutes Laden nicht davon abhängt, dass rohe Base64-Bildnutzdaten in der Antwort des Chatverlaufs verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI aus dem sichtbaren Assistententext Inline-Direktiven-Tags, die nur der Anzeige dienen (beispielsweise `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII- und vollbreite Modellsteuerungstoken. Assistenteneinträge werden ausgelassen, wenn ihr gesamter sichtbarer Text ausschließlich aus dem exakten stillen Token `NO_REPLY` / `no_reply` oder dem Heartbeat-Bestätigungstoken `HEARTBEAT_OK` besteht.
    - Während eines aktiven Sendevorgangs und der abschließenden Aktualisierung des Verlaufs hält die Chatansicht lokale optimistische Benutzer- und Assistentennachrichten sichtbar, falls `chat.history` kurzzeitig einen älteren Snapshot zurückgibt. Das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse stellen den Zustellstatus dar, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach abschließenden Tool-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist unter [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und überträgt ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agentenlauf, keine Kanalzustellung).
    - Die Seitenleiste führt jede geladene aktive Sitzung nach Agentenabschnitt und in den Bereichen „Angeheftet“, „Kanal“, „Arbeit“, benutzerdefinierte Gruppen und „Chats“ auf und bietet eine einzige Aktion „Neue Sitzung“, die den Entwurfsdialog öffnet. Das Öffnen einer sichtbaren Zeile verschiebt lediglich die Hervorhebung. Sitzungen können auf „Angeheftet“ gezogen werden, um sie anzuheften, oder auf eine benutzerdefinierte Gruppe beziehungsweise „Chats“, um sie zu verschieben. Benutzerdefinierte Gruppen lassen sich ein- und ausklappen sowie per Drag-and-drop neu anordnen, Gruppennamen und Reihenfolge werden über den Gateway synchronisiert, und der eingeklappte Zustand verbleibt im Browser. Eine neue Dashboard-Sitzung erhält asynchron aus ihrer ersten Nachricht, die kein Befehl ist, einen prägnanten generierten Titel. Explizite Namen und die authentifizierte Absenderidentität bleiben getrennt, sodass Kontonamen niemals als generierte Titel verwendet werden. Legen Sie `agents.defaults.utilityModel` (oder `agents.entries.*.utilityModel`) fest, um diesen separaten Modellaufruf an ein kostengünstigeres Modell weiterzuleiten. Wenn dieses eigenständige Modell fehlschlägt, wird die Titelerzeugung einmal mit dem primären Modell wiederholt. Beim Erweitern eines anderen Agentenabschnitts können die Sitzungen dieses Agenten durchsucht werden, ohne den geöffneten Chat zu verlassen.
    - Die Thread-Suche befindet sich in der Befehlspalette (⌘K oder die Suchschaltfläche im Steuerungsbereich oben links): Bei Eingabe einer Abfrage wird eine begrenzte Anzahl übereinstimmender Seiten agentenübergreifend durchsucht, interne untergeordnete Zeilen und Cron-Zeilen werden herausgefiltert und sichtbare Treffer neben Navigationsbefehlen aufgelistet. Die Seite „Threads“ enthält weiterhin die vollständige durchsuchbare Liste mit Filtern.
    - Jede Zeile der Seitenleiste bietet direkten Zugriff auf das Anheften sowie ein vollständiges Kontextmenü für den Ungelesen-Status, Umbenennen, Forken, Gruppieren, Archivieren und Löschen. Für mehrfach ausgewählte Zeilen (Cmd-/Strg-Klick, Umschalt-Klick für Bereiche) steht ein Stapelmenü für den Ungelesen-Status, das Gruppieren, Archivieren und Löschen zur Verfügung. Das stapelweise Archivieren oder Löschen bleibt deaktiviert, sofern nicht jede ausgewählte Sitzung archiviert werden kann. Ein aktiver Lauf und die Hauptsitzung eines Agenten können nicht archiviert werden. Beim Archivieren oder Löschen der aktuell ausgewählten Sitzung wechselt der Chat zurück zur Hauptsitzung dieses Agenten.
    - In der macOS-App verwendet das OpenClaw-Zeichen den ansonsten leeren nativen Titelleistenbereich neben den Fenstersteuerelementen, statt eine Zeile der Seitenleiste zu belegen.
    - Bei Desktop-Breiten bleiben die Chat-Steuerelemente in einer kompakten Zeile und werden beim Abwärtsscrollen durch das Transkript eingeklappt. Beim Aufwärtsscrollen, bei der Rückkehr zum Anfang oder beim Erreichen des Endes werden die Steuerelemente wiederhergestellt.
    - Der Sitzungskopf zeigt neben dem Workspace-Chip eine kleine Avatargruppe an, wenn andere Personen dieselbe Sitzung betrachten. Sie enthält bis zu vier Betrachteravatare mit einer Anzahl für weitere Personen und verschwindet, wenn Sie allein sind.
    - Aufeinanderfolgende identische Nachrichten, die nur Text enthalten, werden als eine Sprechblase mit einem Anzahl-Badge dargestellt. Nachrichten mit Bildern, Anhängen, Tool-Ausgaben oder Canvas-Vorschauen werden nicht zusammengefasst.
    - Sprechblasen von Benutzernachrichten bieten Transkriptaktionen: eine beim Darüberfahren eingeblendete Zurückspulen-Schaltfläche (Bestätigungs-Popover mit der Option „Nicht erneut fragen“) sowie beim Rechtsklick **Bis hierher zurückspulen** und **Ab hier forken**. Das Zurückspulen setzt die Sitzung auf den Zustand unmittelbar vor dieser Nachricht zurück und überträgt ihren Text zur Bearbeitung und zum erneuten Senden in den Eingabebereich (`sessions.rewind`, `operator.admin`). Das Forken erstellt aus dem Präfix des aktiven Pfads vor der Nachricht eine neue Sitzung, öffnet sie und befüllt ihren Eingabebereich mit demselben Text (`sessions.fork`, `operator.write`). Beide Aktionen sind während der Arbeit des Agenten deaktiviert und zeigen eine erklärende QuickInfo an, gelten nur für dauerhaft gespeicherte Benutzernachrichten und werden für Sitzungen abgelehnt, deren Unterhaltung einem externen Agenten-Harness gehört. Das Zurückspulen verschiebt nur den Chatkontext – Dateien und andere Nebenwirkungen von Tools werden nicht rückgängig gemacht – und das Transkript vor dem Zurückspulen bleibt im nur anfügbaren Sitzungsspeicher erhalten. Wenn dieser Speicher mehrere Transkriptzweige enthält, zeigt die Chat-Titelleiste ein Zweigmenü mit der jeweils neuesten Nachricht, der Nachrichtenanzahl und der Aktualität jedes Zweigs. Durch Auswahl eines inaktiven Zweigs wird die aktuelle Sitzung auf diesen erhaltenen Pfad zurückgesetzt (`sessions.branches.list`, `operator.read`; `sessions.branches.switch`, `operator.admin`). Der Zweigwechsel ist ebenfalls nicht verfügbar, während der Agent arbeitet, und die Auswahl des bereits aktiven Zweigs führt an der RPC-Grenze zu einem typisierten No-op-Fehler. Die separate Aktion zum Ausblenden an Benutzersprechblasen blendet eine Nachricht nur im aktuellen Browser aus. Die Nachricht verbleibt im Transkript und ist für den Agenten weiterhin sichtbar.
    - Wenn sich der Checkout einer Sitzung auf einem Nicht-Standardzweig eines GitHub-Repositorys befindet, heftet die Chatansicht Pull-Request-Chips oberhalb des Eingabebereichs an: PR-Nummer, Repository, Zweig, Diff-Anzahlen, eine CI-Markierung sowie den Entwurfs-, Zusammengeführt- oder Geschlossen-Status, jeweils mit einem Link zum PR. Die Zeile zeigt höchstens zwei Chips – Live-PRs (offen oder Entwurf) zuerst – und eine Schaltfläche „Mehr anzeigen“ blendet den eingeklappten Verlauf zusammengeführter und geschlossener PRs ein. Die CI-Markierung öffnet ein kleines Popover zur CI-Überwachung mit der Anzahl erfolgreicher, fehlgeschlagener, laufender und übersprungener Prüfungen sowie einem Link zur Prüfungsseite des PRs. Die Erkennung erfolgt serverseitig über `controlUi.sessionPullRequests`, wobei die `GH_TOKEN`/`GITHUB_TOKEN` des Gateways verwendet werden, sofern sie festgelegt sind. Wenn das Ratenlimit der GitHub-API erreicht wird, behalten die Chips den zuletzt bekannten Status bei und zeigen eine Warnung an, dass der Status möglicherweise veraltet ist. Durch Schließen eines Chips wird er für diese Sitzung im aktuellen Browserprofil ausgeblendet. Bevor ein PR vorhanden ist, zeigt die Zeile den Zweig selbst an – Repository, Zweigname und die +/−-Größe des Diffs gegenüber der Merge-Basis des Standardzweigs (committete und nicht committete Arbeit). Sobald der gepushte Zweig vergleichbare Commits enthält, fügt die Zeile eine Schaltfläche „PR erstellen“ hinzu, die GitHubs Seite für neue Pull Requests öffnet. Davor wird die Zeile für eine Sitzung mit geänderten Dateien (committet, nicht committet oder nicht verfolgt) weiterhin angezeigt, jedoch ohne die Schaltfläche. Die Zeile blendet sich aus, solange ein offener PR oder PR-Entwurf vorhanden ist. Die Zweigzeile basiert ausschließlich auf dem lokalen Git und bleibt daher verfügbar, während GitHub ratenbegrenzt ist. Sie zeigt dieselbe Warnung vor einem möglicherweise veralteten Status, da „kein PR gefunden“ erst nach Zurücksetzen des Limits als verlässlich gilt.
    - Das Sitzungs-Diff-Panel zeigt, was der Checkout einer Sitzung tatsächlich geändert hat: Die Zweigschaltfläche in der Workspace-Leiste oder der Chat-Titelleiste öffnet das Detailpanel mit einem Diff pro Datei für Zweig-, nicht committete und nicht verfolgte Arbeit gegenüber der Merge-Basis des Standardzweigs des Checkouts – Statuspunkt, Umbenennungspfeil, +/−-Anzahlen pro Datei, einklappbare Dateien und Markierungen „N unveränderte Zeilen“ zwischen den Hunk-Blöcken. Diffs werden serverseitig über die Gateway-Methode `sessions.diff` berechnet (`operator.read`-Geltungsbereich). Binäre und übergroße Dateien werden auf reine Statistikeinträge reduziert, und die Schaltfläche wird nur angezeigt, wenn der verbundene Gateway `sessions.diff` bekannt gibt.
    - Jeder Chat-Bereich besitzt eine Titelleiste. Klicken Sie auf den Sitzungstitel, um ihn umzubenennen. Der Workspace-Chip kopiert den Checkout-Pfad oder Zweig und kann lokale Gateway-Workspaces im Dateimanager des Hosts anzeigen. Remote-Sitzungen und Sitzungen auf Ausführungs-Nodes behalten die Kopieraktionen bei, blenden das Anzeigen jedoch aus.
    - Die Thread-Workspace-Leiste in jedem Chat-Bereich führt Thread-Dateien, Projektdateien und Artefakte auf. Standardmäßig ist sie am rechten Rand des Bereichs angedockt. Ziehen Sie ihren Kopfbereich oder verwenden Sie die Andocken-Schaltfläche, um sie nach unten zu verschieben. Die Auswahl wird im aktuellen Browserprofil gespeichert. Eine eingeklappte Leiste nimmt überhaupt keinen Platz ein: Öffnen Sie sie mit ⇧⌘B oder über den Dateiumschalter in der Titelleiste erneut, der ein Badge mit der Anzahl geänderter Dateien trägt. Das separate Detailpanel für Dateien, Tools und Canvas bleibt davon unberührt.
    - Durch Klicken auf eine Dateireferenz im Chat, einen Dateipfad in einer erweiterten Tool-Karte zum Lesen, Bearbeiten oder Schreiben oder eine Dateizeile in der Workspace-Leiste wird das Datei-Detailpanel geöffnet: eine auf CodeMirror basierende Codeansicht mit Syntaxhervorhebung, Zeilennummern, Sprung zu einer Zeile, Suche innerhalb der Datei, Kopieraktionen und einem Menü zum Öffnen in einem externen Editor. Wenn der Gateway einer `operator.admin`-Verbindung `sessions.files.set` bekannt gibt, fügt das Panel einen Bearbeitungsmodus mit Erkennung ungespeicherter Änderungen und Speichern per Cmd-/Strg-S hinzu. Ungespeicherte Entwürfe bleiben beim Navigieren zwischen Dateien, Panels und Sitzungen im aktuellen Browser-Tab erhalten, bis sie ausdrücklich gespeichert oder verworfen werden. Speichervorgänge verwenden Compare-and-Swap mit einem von `sessions.files.get` zurückgegebenen Inhalts-Hash: Wenn die Datei seit dem Laden auf dem Datenträger geändert wurde, beispielsweise weil der Agent weitergearbeitet hat, zeigt das Panel einen Konflikthinweis mit den Aktionen „Neu laden“ (neuesten Inhalt übernehmen) und „Überschreiben“ (lokale Bearbeitung beibehalten) an. Schreibvorgänge durchlaufen dieselben dateisystemsicheren Workspace-Schutzmaßnahmen wie Lesevorgänge – Pfadbegrenzung, Ablehnung symbolischer und harter Links sowie ein UTF-8-Limit von 256 KB – und überschreiben nur vorhandene Dateien. Der Editor erstellt oder löscht niemals Dateien.
    - Die Leiste für Hintergrundaufgaben in jedem Chat-Bereich führt die Hintergrundaufgaben und Subagenten des aktuellen Agenten auf (`tasks.list`, nach Agent begrenzt und durch `task`-Ereignisse aktuell gehalten): Laufende Arbeit zeigt einen live aktualisierten Zeitmesser, die Anzahl der Tool-Verwendungen, das aktuell verwendete Tool und eine Stoppsteuerung an. Der einklappbare Abschnitt für abgeschlossene Aufgaben ergänzt die Laufzeiten. Ein Link „Transkript anzeigen“ öffnet die untergeordnete Sitzung der Aufgabe im Bereich. Öffnen Sie die Leiste über den Aktivitätsumschalter in der Titelleiste. Der Aufgaben-Snapshot wird vorab geladen und zeigt daher ein Badge mit der Anzahl laufender Aufgaben an, ohne dass die Leiste zuvor geöffnet werden muss. Die Seite „Aufgaben“ bleibt das vollständige agentenübergreifende Verzeichnis.
    - Die Arbeitsbereichsleiste, die Leiste für Hintergrundaufgaben und das Detailpanel passen sich an die eigene Breite des jeweiligen Bereichs statt an die Fensterbreite an: In einem schmalen Bereich oder kompakten Fenster werden beide Leisten als Streifen am unteren Rand dargestellt (die Steuerelemente für das seitliche Andocken bleiben ausgeblendet, bis der Bereich breiter wird; die Arbeitsbereichsleiste hat Vorrang für den seitlichen Platz, wenn nur eine Spalte hineinpasst), und das Detailpanel wird unterhalb des Threads mit einem horizontalen Ziehgriff zur Größenänderung angeordnet, statt sich mit ihm eine Zeile zu teilen. Bei Viewports in Telefongröße wird das Detailpanel weiterhin im Vollbildmodus geöffnet.
    - Die Auswahlfelder für Modell und Denkmodus im Chat-Header aktualisieren die aktive Sitzung sofort über `sessions.patch`; es handelt sich um dauerhafte Sitzungsüberschreibungen, nicht um nur für einen einzelnen Sendevorgang geltende Optionen.
    - **Geteilte Ansicht:** Öffnen Sie sie über die Chat-Titelleiste (neben den Umschaltern für Thread-Diff, Hintergrundaufgaben und Thread-Dateien) und teilen Sie dann den aktiven Bereich nach rechts oder unten, um so viele Bereiche zu erstellen, wie Platz finden. Jeder Bereich verfügt über einen eigenen Thread, ein eigenes Transkript, einen eigenen Eingabebereich und einen eigenen Tool-Stream.
    - Agenten mit dem Tool `screen` können dieselben Änderungen an Bereichen, Seitenleiste, Terminal, Browser, Fokus und Navigation anfordern, während eine entsprechend geeignete Control UI verbunden ist. Protokoll v1 wendet den Befehl auf jede verbundene geeignete Control UI an; siehe [Bildschirm](/tools/screen).
    - Ziehen Sie eine Sitzung aus der Seitenleiste in den Chat, um sie in einem Bereich zu öffnen. Eine animierte Ablagevorschau gleitet zwischen den Zonen und kennzeichnet das Ergebnis – „Teilen“ über genau der Hälfte, die ein neuer Bereich einnehmen wird, „Hier öffnen“ über einem vollständigen Bereich – und das Ablegen funktioniert auch im Modus mit nur einem Bereich.
    - Der aktive geteilte Bereich bestimmt die Auswahl in der Seitenleiste und die URL. Seine Titelleiste enthält zusätzliche Steuerelemente zum Teilen und Schließen; Trennlinien ermöglichen die Größenänderung von Spalten und übereinander angeordneten Bereichen, und der Browser speichert das Layout lokal über Seitenneuladungen hinweg.
    - Auf schmalen Bildschirmen behält die geteilte Ansicht das Layout bei, stellt jedoch nur den aktiven Bereich dar, einschließlich seines Headers mit dem Steuerelement zum Schließen.
    - Wenn Sie eine Nachricht senden, während eine Änderung der Modellauswahl für dieselbe Sitzung noch gespeichert wird, wartet der Eingabebereich auf diese Sitzungsaktualisierung, bevor `chat.send` aufgerufen wird, damit beim Senden das ausgewählte Modell verwendet wird.
    - Die Eingabe von `/new` erstellt dieselbe neue Dashboard-Sitzung wie New Chat, wechselt zu ihr und verhält sich nur dann anders, wenn `session.dmScope: "main"` konfiguriert und das aktuelle übergeordnete Element die Hauptsitzung des Agenten ist; in diesem Fall wird die Hauptsitzung direkt zurückgesetzt. Die Eingabe von `/reset` behält das explizite direkte Zurücksetzen der aktuellen Sitzung durch den Gateway bei.
    - Die Modellauswahl des Chats fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.modelPolicy.allow` nicht leer ist, bestimmt diese Richtlinie die Auswahl, einschließlich der Einträge unter `provider/*`, durch die Provider-spezifische Kataloge dynamisch bleiben. Andernfalls zeigt die Auswahl konfigurierte Einträge sowie Provider mit verwendbarer Authentifizierung an; Aliasse und Einstellungen unter `agents.defaults.models` schränken sie nicht ein. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn aktuelle Nutzungsberichte zu Gateway-Sitzungen die derzeitigen Kontext-Token enthalten, zeigt die Symbolleiste des Chat-Eingabebereichs einen kleinen Ring für die Kontextnutzung mit dem verwendeten Prozentsatz an. Öffnen Sie den Ring, um das aktuelle Kontextfenster, die Token-Anzahlen des letzten Durchlaufs und die geschätzten Gesamtkosten, die Identität von Provider und Modell sowie – sofern gemeldet – die Aufschlüsselung der Eingabe-, Ausgabe- und Cache-Kosten der neuesten Provider-Antwort anzuzeigen. Bei hoher Kontextauslastung wechselt der Ring zu einer Warnungsdarstellung und zeigt bei empfohlenen Compaction-Schwellenwerten eine kompakte Schaltfläche an, die den normalen Compaction-Pfad der Sitzung ausführt. Veraltete Token-Momentaufnahmen bleiben ausgeblendet, bis der Gateway erneut aktuelle Nutzungsdaten meldet.

  </Accordion>
  <Accordion title="Talk-Modus (Browser-Echtzeit)">
    Der Talk-Modus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` sowie einem `openai`-API-Schlüsselprofil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`. OpenAI Realtime verwendet die öffentliche Platform API und erfordert einen Platform-API-Schlüssel; eine Codex-OAuth-Anmeldung erfüllt diese Anforderung nicht. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` sowie `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen regulären Provider-API-Schlüssel: OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC, und Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch das Gateway im Token festgeschrieben werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, werden über den Gateway-Relay-Transport ausgeführt. Dadurch verbleiben Anmeldedaten und Anbieter-Sockets auf der Serverseite, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Prompt der Realtime-Sitzung wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Überschreibungen der Anweisungen.

    Dauerhafte Standardeinstellungen für Provider, Modell, Stimme, Transport, Reasoning-Aufwand, exakten VAD-Schwellenwert, Stilledauer und Präfix-Padding befinden sich unter **Einstellungen → Kommunikation → Talk**; Änderungen daran erfordern Zugriff auf `operator.admin`. Die Konfiguration des Gateway-Relays erzwingt den Backend-Relay-Pfad; bei der Konfiguration von WebRTC bleibt die Sitzung im Besitz des Clients und schlägt fehl, statt stillschweigend auf das Relay zurückzufallen, wenn der Provider keine Browsersitzung erstellen kann.

    Das Talk-Steuerelement selbst ist die Mikrofonschaltfläche in der Composer-Symbolleiste. Das zugehörige Caret-Menü listet **System default** und jedes vom Browser bereitgestellte Mikrofon auf, einschließlich USB-, Bluetooth- und virtueller Eingänge. Die ausgewählte Geräte-ID verbleibt lokal im Browser und wird niemals an das Gateway gesendet; wenn genau dieses Gerät nicht mehr verfügbar ist, fordert Talk Sie zur Auswahl eines anderen Eingangs auf, statt stillschweigend über ein anderes Mikrofon aufzunehmen. Während Talk aktiv ist, wird die Mikrofonschaltfläche zu einer pillenförmigen Anzeige mit dem Live-Eingangspegel; ein Klick darauf stoppt die Spracheingabe, und beim Darüberfahren wird das Stoppsymbol angezeigt. Screenreader geben `Connecting voice input...`, `Listening...` oder `Asking OpenClaw...` aus, während ein Echtzeit-Tool-Aufruf über `talk.client.toolCall` das konfigurierte größere Modell konsultiert. Das Stoppen einer laufenden Agentenantwort bleibt ein separates quadratisches **Stopp**-Steuerelement neben der pillenförmigen Anzeige.

    **Video-Talk** ist für OpenAI-Realtime-WebRTC- und Google-Live-Browsersitzungen verfügbar. Klicken Sie auf die Kameraschaltfläche, erlauben Sie den Kamera- und Mikrofonzugriff und bestätigen Sie die lokale Vorschau. OpenAI sendet einen begrenzten JPEG-Frame über seinen Browser-Datenkanal, wenn `describe_view` visuellen Kontext anfordert. Google Live sendet begrenzte JPEG-Frames mit dem unterstützten Maximum von einem Frame pro Sekunde direkt vom Browser an den Provider und beantwortet `describe_view`-Funktionsaufrufe mit dem Status des Kamerastreams. Kameraframes durchlaufen niemals das Gateway. Beim Stoppen von Talk wird die Vorschau geschlossen und beide Medienspuren werden freigegeben. Informationen zu den Übertragungsverträgen des Providers finden Sie in Googles Dokumentation zu den [Funktionen der Live API](https://ai.google.dev/gemini-api/docs/live-api/capabilities#video) und im [Leitfaden zu Funktionsaufrufen](https://ai.google.dev/gemini-api/docs/live-api/tools).

    Live-Smoke-Test für Maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` überprüft die OpenAI-Backend-WebSocket-Bridge, den WebRTC-SDP-Austausch im OpenAI-Browser, die Browser-Einrichtung von Google Live mit eingeschränktem Token einschließlich eines JPEG-Frames und eines `describe_view`-Funktions-Roundtrips sowie den Browseradapter des Gateway-Relays mit simulierten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stopp** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, verwenden normale Folgenachrichten den effektiven `messages.queue`-Modus des Gateways. `steer` fügt sie in den laufenden Turn ein; andere Modi behalten die dauerhafte Warteschlangenzustellung des Browsers bei. Wird das Steuern abgelehnt, wird ebenfalls auf diese Warteschlange zurückgegriffen. Klicken Sie bei einer Nachricht in der Warteschlange auf **Steuern**, um sie manuell einzufügen.
    - **Einstellungen → Darstellung → Chat → Folgenachrichten, während der Agent arbeitet** kann diesen Serverstandard für den aktuellen Browser überschreiben. Die Seite kennzeichnet eine Überschreibung ausdrücklich und bietet **Auf Serverstandard zurücksetzen** an. `Steer into the active run` sendet Folgenachrichten sofort, während `Queue until the run ends` sie zurückhält, bis der Lauf beendet ist.
    - Geben Sie `/stop` (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) ein, um außerhalb des regulären Ablaufs abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (kein `runId`), um alle aktiven Läufe für diese Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung von Teilinhalten bei Abbruch">
    - Wenn ein Lauf abgebrochen wird, kann unvollständiger Assistententext weiterhin in der Benutzeroberfläche angezeigt werden.
    - Das Gateway speichert abgebrochenen unvollständigen Assistententext im Transkriptverlauf, wenn gepufferte Ausgaben vorhanden sind.
    - Gespeicherte Einträge enthalten Abbruchmetadaten, sodass Transkriptkonsumenten abgebrochene Teilinhalte von regulären Abschlussausgaben unterscheiden können.

  </Accordion>
</AccordionGroup>

## Verbindungsverlust und erneute Verbindung

Nachdem eine Sitzung hergestellt wurde, meldet eine unterbrochene Gateway-Verbindung Sie nicht ab. Das Dashboard
bleibt sichtbar und zeigt unter der oberen Leiste eine schwebende bernsteinfarbene pillenförmige Anzeige mit „Gateway-Verbindung unterbrochen — Verbindung wird wiederhergestellt…“,
während der Client mit Backoff automatisch neue Versuche unternimmt (800 ms bis zu 15 s). Live-Aktualisierungen und
Echtzeit-/Sitzungsaktionen werden pausiert, bis die Verbindung wiederhergestellt ist; **Jetzt erneut versuchen** in der Anzeige erzwingt
einen sofortigen Versuch. Der Chat bleibt bearbeitbar: Gewöhnliche Text- und Anhangsendungen werden im
Gateway-/sitzungsspezifischen Browserspeicher des aktuellen Tabs aufbewahrt, als auf die erneute Verbindung wartend angezeigt und
automatisch gesendet, sobald das Gateway wieder verfügbar ist. Live-Steuerelemente und Slash-Befehle bleiben offline
nicht verfügbar.

Wenn dieser Browser bereits über Anmeldedaten verfügt (ein konfiguriertes Token/Passwort oder ein genehmigtes Geräte-
token), zeigen das erstmalige Öffnen und erneute Laden ein kleines animiertes OpenClaw-Zeichen, während die Verbindung
hergestellt wird, statt kurz die Anmeldesperre einzublenden. Die Anmeldesperre erscheint nur, wenn noch keine Anmeldedaten
gespeichert sind oder wenn das Gateway sie aktiv ablehnt (falsches Token/Passwort, widerrufene Kopplung) —
Zustände, die Ihre Eingabe erfordern, statt abzuwarten.

## PWA-Installation und Web Push

Die Control UI wird mit einer `manifest.webmanifest` und einem Service Worker ausgeliefert, sodass moderne Browser sie als eigenständige PWA installieren können. Web Push ermöglicht es dem Gateway, die installierte PWA auch dann mit Benachrichtigungen zu aktivieren, wenn der Tab oder das Browserfenster nicht geöffnet ist.

In der macOS-App zeigt die Seite mit den Benachrichtigungseinstellungen die native Benachrichtigungsberechtigung der App statt Browser-Push an, da die App Benachrichtigungen nativ zustellt.

Wenn die Seite direkt nach einem OpenClaw-Update **Protokollabweichung** anzeigt, öffnen Sie zunächst das Dashboard erneut mit `openclaw dashboard` und führen Sie eine vollständige Aktualisierung durch. Wenn der Fehler weiterhin auftritt, löschen Sie die Websitedaten für den Dashboard-Ursprung oder testen Sie in einem privaten Browserfenster; ein alter Tab oder Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle von vor dem Update mit dem neueren Gateway ausführen.

| Oberfläche                                         | Funktion                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                   | PWA-Manifest. Browser bieten „Install app“ an, sobald es erreichbar ist.     |
| `ui/public/sw.js`                                  | Service Worker, der `push`-Ereignisse und Benachrichtigungsklicks verarbeitet. |
| `state/openclaw.sqlite` → `web_push_vapid_keys`    | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzdaten. |
| `state/openclaw.sqlite` → `web_push_subscriptions` | Gespeicherte Browser-Abonnementendpunkte, Schlüssel und Registrierungszeitstempel. |

Upgrades aus den stillgelegten Speichern `push/vapid-keys.json` und `push/web-push-subscriptions.json` werden von `openclaw doctor --fix` importiert. Stoppen Sie das Gateway, bevor Sie diese Reparatur ausführen, damit ein älterer Prozess während des Imports keinen stillgelegten Zustand erneut erstellen kann. Führen Sie die Reparatur nach einem Upgrade aus, bevor Sie Web Push verwenden; Registrierung, Zustellung, Löschung und Schlüsselauflösung verweigern die Ausführung, solange noch eine der stillgelegten Quellen oder ein unterbrochener Doctor-Claim vorhanden ist. Die Gateway-Laufzeit liest und schreibt ausschließlich SQLite.

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen des Gateway-Prozesses, wenn Sie die Schlüssel festlegen möchten (Bereitstellungen mit mehreren Hosts, Rotation von Secrets oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standardwert: `https://openclaw.ai`)

Die Control UI verwendet diese bereichsbeschränkten Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` registriert einen `endpoint` zusammen mit `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` entfernt einen registrierten Endpunkt.
- `push.web.test` sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für Relay-gestützte Push-Benachrichtigungen) und von der Methode `push.test`, die auf native Mobilgerätekopplung ausgerichtet ist.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte mit dem Shortcode `[embed ...]` inline darstellen. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

Das Core-Tool [`show_widget`](/de/tools/show-widget) rendert eigenständiges SVG oder HTML direkt aus einem Tool-Aufruf. Der Browser und unterstützte native Chat-Clients melden die Gateway-Fähigkeit `inline-widgets`, und das resultierende Canvas-Dokument bleibt verfügbar, wenn der Chatverlauf neu geladen wird. Discord Activities stellt auf Discord denselben Tool-Namen bereit; Läufe, die aus anderen Kanälen stammen, erhalten ihn nicht.

<Tabs>
  <Tab title="strikt">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="Skripte (Standard)">
    Ermöglicht interaktive Einbettungen bei gleichzeitiger Ursprungsisolation; normalerweise ausreichend für eigenständige Browserspiele/-Widgets.
  </Tab>
  <Tab title="vertrauenswürdig">
    Fügt `allow-same-origin` zusätzlich zu `allow-scripts` für Dokumente derselben Website hinzu, die bewusst weiterreichende Berechtigungen benötigen.
  </Tab>
</Tabs>

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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Same-Origin-Verhalten benötigt. Für die meisten von Agenten generierten Spiele und interaktiven Canvas-Darstellungen ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Damit `[embed url="https://..."]` Seiten von Drittanbietern laden kann, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Layout des Chattranskripts

Das Chattranskript verwendet einen zentrierten, gut lesbaren Rahmen, der am Composer ausgerichtet ist. Assistenten- und Tool-Ausgaben bleiben linksbündig, während Ihre eigenen Nachrichten innerhalb dieses Rahmens rechtsbündig bleiben. In Mehrbenutzersitzungen (beispielsweise einem Gruppenchat, der von einem Kanal-Plugin weitergeleitet wird) werden Nachrichten anderer zugeordneter Teilnehmer linksbündig mit Avatar, Name und einer stabilen identitätsspezifischen Farbe des Autors dargestellt, sodass nur die Nachrichten des angemeldeten Betrachters als „meine“ erscheinen. Wenn zwei oder mehr zugeordnete Teilnehmer vorhanden sind, enthalten Assistentenantworten eine kleine Markierung „Antwort an Name“, die den Teilnehmer benennt, dessen Nachricht den Turn ausgelöst hat. Systemeinträge wie die lokale Ausgabe von Slash-Befehlen werden als zentrierte Hinweiszeilen ohne Avatar dargestellt.

## Breite von Chatnachrichten

Benutzer mit breiten Monitoren können die Transkriptbreite unter **Einstellungen → Chat →
Nachrichtenbreite** überschreiben. Die Einstellung verbleibt im lokalen Speicher dieses Browsers. Unterstützte
Formen umfassen einfache Längen und Prozentwerte wie `960px` oder `82%` sowie
eingeschränkte Breitenausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und
`fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Belassen Sie das Gateway auf Loopback und lassen Sie Tailscale Serve es über HTTPS weiterleiten:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie `https://<magicdns>/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`).

    Standardmäßig können sich Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifizieren, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw überprüft die Identität, indem es die `x-forwarded-for`-Adresse mit `tailscale whois` auflöst und mit dem Header abgleicht. Diese Anfragen werden nur akzeptiert, wenn sie Loopback mit den `x-forwarded-*`-Headern von Tailscale erreichen. Bei Control-UI-Operatorsitzungen mit Browser-Geräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Roundtrip für die Gerätekopplung; Browser ohne Geräteidentität und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Datenverkehr explizite Shared-Secret-Zugangsdaten verlangen möchten, und verwenden Sie anschließend `gateway.auth.mode: "token"` oder `"password"`.

    Bei diesem asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungsbereich vor den Schreibvorgängen für die Ratenbegrenzung serialisiert. Gleichzeitige fehlerhafte Wiederholungsversuche desselben Browsers können daher bei der zweiten Anfrage `retry later` anzeigen, anstatt dass zwei einfache Nichtübereinstimmungen parallel miteinander konkurrieren.

    <Warning>
    Die tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Falls nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, müssen Sie eine Token-/Passwortauthentifizierung verlangen.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie `http://<tailscale-ip>:18789/` (oder Ihr konfiguriertes `gateway.controlUi.basePath`).

    Fügen Sie das passende Shared Secret in die UI-Einstellungen ein (wird als `connect.params.auth.token` oder `connect.params.auth.password` gesendet).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über einfaches HTTP öffnen (`http://<lan-ip>` oder `http://<tailscale-ip>`), wird der Browser in einem **nicht sicheren Kontext** ausgeführt und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Die unterstützte Ausnahme ohne Geräteidentität ist eine erfolgreiche Control-UI-Operatorauthentifizierung
über `gateway.auth.mode: "trusted-proxy"`. Es gibt keinen dauerhaften Konfigurationsschalter,
der die Geräteidentität deaktiviert.

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die UI lokal unter `https://<magicdns>/` (Serve) beziehungsweise `http://127.0.0.1:18789/` (auf dem Gateway-Host).

<AccordionGroup>
  <Accordion title="Hinweis zu vertrauenswürdigen Proxys">
    - Eine erfolgreiche Authentifizierung über einen vertrauenswürdigen Proxy kann Control-UI-Sitzungen mit **Operatorrolle** ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Loopback-Reverse-Proxys auf demselben Host erfüllen die Anforderungen der Authentifizierung über einen vertrauenswürdigen Proxy weiterhin nicht; siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Anleitungen zur HTTPS-Einrichtung finden Sie unter [Tailscale](/de/gateway/tailscale).

## Content Security Policy

Die Control UI wird mit einer strengen `img-src`-Richtlinie ausgeliefert: Zulässig sind nur Ressourcen desselben Ursprungs, `data:`-URLs und lokal erzeugte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen niemals Netzwerkanfragen aus.

In der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (beispielsweise `/avatars/<id>`), werden weiterhin dargestellt. Dies umfasst authentifizierte Avatar-Routen, die von der UI abgerufen und in lokale `blob:`-URLs umgewandelt werden.
- Inline-`data:image/...`-URLs werden weiterhin dargestellt.
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin dargestellt.
- Avatare für GitHub-Linkvorschauen werden vom Gateway über den festgelegten Avatar-Host von GitHub abgerufen und als begrenzte `data:`-URLs zurückgegeben; der Browser des Operators kontaktiert den entfernten Avatar-Host niemals.
- Von Kanalmetadaten ausgegebene entfernte Avatar-URLs werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo beziehungsweise Abzeichen ersetzt. Daher kann ein kompromittierter oder bösartiger Kanal keine beliebigen Abrufe entfernter Bilder durch den Browser eines Operators erzwingen.

Diese Funktion ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn die Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie die übrige API:

- `GET /avatar/<agentId>` gibt das Avatarbild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatarmetadaten unter derselben Voraussetzung zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der zugehörigen Assistentenmedien-Route), sodass die Avatar-Route auf ansonsten geschützten Hosts keine Agentenidentität preisgeben kann.
- Die Control UI leitet das Gateway-Token beim Abrufen von Avataren als Bearer-Header weiter und verwendet authentifizierte Blob-URLs, damit das Bild weiterhin in Dashboards dargestellt wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird entsprechend dem restlichen Gateway auch die Avatar-Route nicht authentifiziert.

## Authentifizierung der Assistentenmedien-Route

Wenn die Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operatorauthentifizierung der Control UI; beim Prüfen der Verfügbarkeit sendet der Browser das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, dessen Gültigkeit auf genau diesen Quellpfad beschränkt ist.
- Vom Browser dargestellte URLs für Bilder, Audio, Video und Dokumente verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Dadurch bleibt die Mediendarstellung mit nativen Medienelementen des Browsers kompatibel, ohne wiederverwendbare Gateway-Zugangsdaten in sichtbaren Medien-URLs offenzulegen.

## Genehmigungslinks

Benachrichtigungen über Operatorgenehmigungen können per Deep Link auf ein eigenständiges Genehmigungsdokument verweisen, das im reservierten `${controlUiBasePath}/approve/{approvalId}`-Namensraum bereitgestellt wird (beispielsweise `/approve/<approvalId>` oder `/openclaw/approve/<approvalId>` mit einem konfigurierten Basispfad). Die URL bleibt für die Lebensdauer der Genehmigung stabil und kann sicher zwischen Ihren eigenen Geräten weitergeleitet werden: Sie identifiziert die Genehmigung, autorisiert sie jedoch niemals.

- Der aus einem Segment bestehende `/approve/<approvalId>`-Namensraum wird vom Gateway vor den HTTP-Routen der Plugins für **alle** HTTP-Methoden reserviert, sodass eine Plugin-Route ein Genehmigungsdokument niemals verdecken oder abfangen kann.
- Das Öffnen eines Genehmigungsdokuments erfordert dieselbe Gateway-Authentifizierung wie die übrige Control UI (Token/Passwort, Tailscale-Serve-Identität oder Identität über einen vertrauenswürdigen Proxy); Zugangsdaten sind niemals Bestandteil der Genehmigungs-URL.
- Wenn die Bereitstellung der Control UI deaktiviert ist, geben Anfragen an den Namensraum `404` zurück, statt an Plugin-Handler weitergeleitet zu werden.
- Die Anmeldung in einem Genehmigungsdokument gilt nur vorübergehend für diese Seite: Sie überschreibt weder die Gateway-Auswahl noch die Einstellungen, die von der vollständigen Control UI im selben Browser gespeichert wurden.

Das Gateway stellt statische Dateien aus `dist/control-ui` bereit:

```bash
pnpm ui:build
```

Optionale absolute Basis (feste Ressourcen-URLs):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Lokale Entwicklung (separater Entwicklungsserver):

```bash
pnpm ui:dev
```

Richten Sie die UI anschließend auf die WebSocket-URL Ihres Gateways (z. B. `ws://127.0.0.1:18789`).

## Leere Control-UI-Seite

Wenn der Browser ein leeres Dashboard lädt und die Entwicklertools keinen hilfreichen Fehler anzeigen, hat möglicherweise eine Erweiterung oder ein früh ausgeführtes Inhaltsskript verhindert, dass die JavaScript-Modulanwendung ausgewertet wird. Die statische Seite enthält einen einfachen HTML-Wiederherstellungsbereich, der erscheint, wenn `<openclaw-app>` nach dem Start nicht registriert wurde.

Verwenden Sie nach einer Änderung der Browserumgebung die Aktion **Erneut versuchen** des Bereichs oder laden Sie die Seite nach diesen Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die Inhalte in alle Seiten einfügen, insbesondere Erweiterungen mit `<all_urls>`-Inhaltsskripten.
- Versuchen Sie es mit einem privaten Fenster, einem sauberen Browserprofil oder einem anderen Browser.
- Lassen Sie das Gateway laufen und prüfen Sie nach der Browseränderung dieselbe Dashboard-URL.

## Debugging/Tests: Entwicklungsserver + entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann vom HTTP-Ursprung abweichen. Dies ist praktisch, wenn Sie den Vite-Entwicklungsserver lokal verwenden möchten, das Gateway jedoch an einem anderen Ort ausgeführt wird.

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, codieren Sie den Wert als URL, damit der Browser die Abfragezeichenfolge korrekt analysiert.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch eine Offenlegung über Anforderungsprotokolle und den Referer vermieden wird. Veraltete `?token=`-Abfrageparameter werden aus Kompatibilitätsgründen weiterhin einmalig importiert, jedoch nur als Fallback, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird ausschließlich im Arbeitsspeicher aufbewahrt.
    - Wenn `gatewayUrl` gesetzt ist, greift die UI nicht auf Zugangsdaten aus der Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) explizit an; fehlende explizite Zugangsdaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Control-UI-Bereitstellungen außerhalb von Loopback müssen `gateway.controlUi.allowedOrigins` explizit festlegen (vollständige Ursprünge). Private LAN-/Tailnet-Ladevorgänge desselben Ursprungs von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Host-Header-Fallback zu aktivieren.
    - Beim Start kann das Gateway lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` aus der effektiven Laufzeitbindung und dem Port übernehmen; entfernte Browserursprünge benötigen jedoch weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` ausschließlich für streng kontrollierte lokale Tests; es bedeutet, dass jeder Browserursprung zugelassen wird, nicht „mit dem von mir verwendeten Host übereinstimmen“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Fallback-Modus für den Host-Header-Ursprung, dies ist jedoch ein gefährlicher Sicherheitsmodus.

  </Accordion>
</AccordionGroup>

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Einzelheiten zur Einrichtung des Fernzugriffs: [Fernzugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Zustandsprüfungen](/de/gateway/health) — Überwachung des Gateway-Zustands
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
