---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten ohne SSH-Tunnel auf das Tailnet zugreifen
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Aktivität, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-07-12T21:41:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b1da56979bd134ce0be8ab0a2fbee658952515db5e422fbe9eb685968de8a755
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine, vom Gateway bereitgestellte **Vite + Lit**-Single-Page-App:

- Standard: `http://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`).

Sie kommuniziert **direkt mit dem Gateway-WebSocket** am selben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer ausgeführt wird, öffnen Sie [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/)).

Wenn die Seite nicht geladen werden kann, starten Sie zuerst das Gateway: `openclaw gateway`.

<Note>
Bei nativen Windows-LAN-Bindungen können die Windows-Firewall oder durch die Organisation verwaltete Gruppenrichtlinien die angegebene LAN-URL weiterhin blockieren, selbst wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, nicht übereinstimmende Profile und lokale Firewallregeln, die möglicherweise durch Richtlinien außer Kraft gesetzt werden.
</Note>

Die Authentifizierung wird während des WebSocket-Handshakes über Folgendes bereitgestellt:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Der Einstellungsbereich des Dashboards speichert ein Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL; Passwörter werden nicht dauerhaft gespeichert. Beim Onboarding wird normalerweise bei der ersten Verbindung ein Gateway-Token für die Authentifizierung mit einem gemeinsamen Geheimnis generiert, aber die Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Für die Verbindung über einen neuen Browser oder ein neues Gerät ist normalerweise eine **einmalige Kopplungsgenehmigung** erforderlich, die als `disconnected (1008): pairing required` angezeigt wird.

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Bereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Wenn ein bereits gekoppelter Browser vom Lesezugriff auf Schreib-/Administratorzugriff umgestellt wird, gilt dies als Erweiterung der Genehmigung und nicht als automatische erneute Verbindung: OpenClaw lässt die alte Genehmigung aktiv, blockiert die erneute Verbindung mit den umfassenderen Berechtigungen und fordert Sie auf, die neuen Bereiche ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie diese nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Informationen zur Tokenrotation, zum Widerruf und zum Genehmigungsablauf beim ersten Start von Paperclip / `openclaw_gateway` finden Sie unter [Geräte-CLI](/de/cli/devices).

<Note>
- Direkte lokale Browser-Verbindungen über die Loopback-Schnittstelle (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann bei Control-UI-Bediensitzungen den Kopplungsvorgang überspringen, wenn `gateway.auth.allowTailscale: true` gilt, die Tailscale-Identität verifiziert wird und der Browser seine Geräteidentität bereitstellt. Browser ohne Geräteidentität und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Geräteprüfungen.
- Direkte Tailnet-Bindungen, LAN-Browserverbindungen und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil generiert eine eindeutige Geräte-ID. Daher ist beim Wechsel des Browsers oder beim Löschen der Browserdaten eine erneute Kopplung erforderlich.

</Note>

## Mobilgerät koppeln

Ein bereits gekoppelter Administrator kann den QR-Code für die iOS-/Android-Verbindung erstellen, ohne ein Terminal zu öffnen:

<Steps>
  <Step title="Kopplung für Mobilgeräte öffnen">
    Wählen Sie **Devices** aus und klicken Sie anschließend auf der Karte **Devices** auf **Pair mobile device**.
  </Step>
  <Step title="Telefon verbinden">
    Öffnen Sie in der mobilen OpenClaw-App **Settings** → **Gateway** und scannen Sie den QR-Code. Alternativ können Sie den Einrichtungscode kopieren und einfügen.
  </Step>
  <Step title="Verbindung bestätigen">
    Die offizielle iOS-/Android-App stellt die Verbindung automatisch her. Wenn unter **Pending approval** eine Anfrage angezeigt wird, prüfen Sie deren Rolle und Bereiche, bevor Sie sie genehmigen.
  </Step>
</Steps>

Zum Erstellen eines Einrichtungscodes ist `operator.admin` erforderlich; für Sitzungen ohne diese Berechtigung ist die Schaltfläche deaktiviert. Ein Einrichtungscode enthält kurzzeitig gültige Bootstrap-Anmeldedaten. Behandeln Sie daher den QR-Code und den kopierten Code wie ein Passwort, solange sie gültig sind. Für die Remote-Kopplung muss das Gateway zu `wss://` aufgelöst werden (beispielsweise über Tailscale Serve/Funnel); unverschlüsseltes `ws://` ist auf Loopback- und private LAN-Adressen beschränkt. Die vollständigen Sicherheits- und Fallback-Details finden Sie unter [Kopplung](/de/channels/pairing#pair-from-the-control-ui-recommended).

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine browserbezogene persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen hinzugefügt wird. Sie befindet sich im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die normalen Metadaten zur Autorenschaft der von Ihnen gesendeten Nachrichten hinaus gespeichert. Durch das Löschen der Websitedaten oder den Wechsel des Browsers wird sie zurückgesetzt.

Das Überschreiben des Assistenten-Avatars folgt demselben browserlokalen Muster: Hochgeladene Überschreibungen überlagern die vom Gateway aufgelöste Identität lokal und werden niemals über `config.patch` übertragen. Das gemeinsame Konfigurationsfeld `ui.assistant.avatar` bleibt für Nicht-UI-Clients verfügbar, die direkt in dieses Feld schreiben.

## Endpunkt für die Laufzeitkonfiguration

Die Control UI ruft ihre Laufzeiteinstellungen aus `/control-ui-config.json` ab, relativ zum Control-UI-Basispfad des Gateways aufgelöst (beispielsweise `/__openclaw__/control-ui-config.json` unter dem Basispfad `/__openclaw__/`). Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert ein gültiges Gateway-Token/-Passwort, eine Tailscale-Serve-Identität oder eine Identität eines vertrauenswürdigen Proxys.

## Status des Gateway-Hosts

Öffnen Sie in der einfachen Ansicht **Settings**, um die Karte **Gateway Host** mit dem Gateway-Computer, der LAN-Adresse, dem Betriebssystem, der Laufzeit, der Betriebszeit, der CPU-Auslastung, dem Arbeitsspeicher und dem Speicherplatz des Status-Volumes anzuzeigen. Die Karte wird, solange sie sichtbar ist, alle 10 Sekunden über den Gateway-RPC `system.info` aktualisiert, der den Bereich `operator.read` erfordert. Bei älteren Gateways und Verbindungen ohne diesen Bereich wird die Karte nicht angezeigt.

## Sprachunterstützung

Die Control UI lokalisiert sich beim ersten Laden anhand des Gebietsschemas Ihres Browsers. Um dies später zu überschreiben, öffnen Sie **Settings -> General -> Language** (die Auswahl befindet sich auf der Karte mit den allgemeinen Schnelleinstellungen, nicht unter Appearance).

- Unterstützte Gebietsschemas: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Nicht englische Übersetzungen werden im Browser verzögert geladen.
- Das ausgewählte Gebietsschema wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel greifen auf Englisch zurück.

Dokumentationsübersetzungen werden für dieselben nicht englischen Gebietsschemas generiert, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite führt nur Gebietsschemacodes auf, die Mintlify akzeptiert. Die thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repository generiert; sie erscheint möglicherweise erst in dieser Auswahl, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemen

Der Bereich Appearance enthält die integrierten Themen Claw, Knot und Dash (Claw ist die Standardeinstellung) sowie einen browserlokalen Importplatz für tweakcn. Um ein Thema zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Thema, klicken Sie auf **Share** und fügen Sie den kopierten Link unter Appearance ein. Der Import akzeptiert außerdem Registry-URLs im Format `https://tweakcn.com/r/themes/<id>`, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade im Format `/themes/<id>`, reine Themen-IDs und Namen von Standardthemen wie `amethyst-haze`.

Importierte Themen werden ausschließlich im aktuellen Browserprofil gespeichert; sie werden weder in die Gateway-Konfiguration geschrieben noch geräteübergreifend synchronisiert. Wenn Sie das importierte Thema ersetzen, wird der eine lokale Platz aktualisiert; wenn Sie es löschen, wird zu Claw zurückgewechselt, sofern das importierte Thema aktiv war.

Appearance bietet außerdem eine browserlokale Einstellung für die Textgröße, die zusammen mit den übrigen Control-UI-Einstellungen gespeichert wird. Sie gilt für Chattext, Text im Eingabebereich, Tool-Karten und Chat-Seitenleisten und belässt Texteingaben bei mindestens 16px, damit Safari auf Mobilgeräten beim Fokussieren nicht automatisch zoomt.

## Plugins verwalten

Öffnen Sie in der Seitenleiste **Plugins** oder verwenden Sie `/settings/plugins` relativ zum
konfigurierten Control-UI-Basispfad, um Plugins zu durchsuchen und zu verwalten, ohne die
Control UI zu verlassen. Beispielsweise verwendet der Basispfad `/openclaw` den Pfad
`/openclaw/settings/plugins`. Die Seite ist immer verfügbar, selbst wenn alle
optionalen Plugins deaktiviert sind.

Plugins ist eine Zentrale mit vier Registerkarten: **Installed** und **Discover** verwalten Plugin-
Code unter `/settings/plugins`, **Skills** enthält die Skill-Verwaltung pro Agent unter
`/skills`, und **Workshop** enthält die Überprüfung von Skill-Workshop-Vorschlägen unter
`/skills/workshop`. Jede Registerkarte behält ihre eigene URL bei, und die Seitenleiste zeigt für
alle einen einzigen Eintrag Plugins an.

Die Registerkarte **Installed** zeigt den vollständigen lokalen Bestand nach Kategorien gruppiert und mit
Übersichtszahlen an. Jede Zeile öffnet eine Detailansicht; über ihr Überlaufmenü (`…`) lässt sich
das Plugin aktivieren oder deaktivieren, und für extern installierte Plugins wird **Remove** angeboten.
Außerdem werden konfigurierte [MCP-Server](/de/cli/mcp) aufgelistet, die direkt hinzugefügt, deaktiviert
und entfernt werden können. Die Registerkarte **Discover** ist der Store: empfohlene, in OpenClaw
enthaltene Plugins, offizielle externe Plugins und MCP-Konnektoren für beliebte Dienste, die mit einem Klick
eingerichtet werden können. Eingaben in das Suchfeld durchsuchen
[ClawHub](https://clawhub.ai/plugins) direkt und fügen einen Abschnitt **From ClawHub**
mit Downloadzahlen und Kennzeichnungen zur Quellenverifizierung hinzu. Deep Links können
mit `/settings/plugins?tab=discover` direkt auf den Store verweisen.

Die Registerkarte **Skills** enthält den Skill-Statusbericht, Schalter zum Aktivieren und Deaktivieren, die Eingabe von API-
Schlüsseln und die direkte ClawHub-Skill-Suche, jeweils beschränkt auf den ausgewählten Agent. Die
Registerkarte **Workshop** enthält das Skill-Workshop-Board und den heutigen Überprüfungsablauf für
[Skill-Vorschläge](/de/tools/skill-workshop).

Enthaltene Plugins sind bereits auf dem Gateway vorhanden und zeigen **Enable** oder
**Disable** anstelle von **Install** an. Workboard ist beispielsweise in
OpenClaw enthalten, aber standardmäßig deaktiviert, weshalb die zugehörige Aktion **Enable** lautet. Gebündelte Plugins
können nicht entfernt, sondern nur deaktiviert werden.

Zum Lesen des Katalogs und Durchsuchen von ClawHub ist `operator.read` erforderlich. Für das Installieren,
Aktivieren, Deaktivieren oder Entfernen eines Plugins sowie das Ändern von MCP-Servern ist
`operator.admin` erforderlich; für Bediener mit ausschließlich Lesezugriff bleiben diese Aktionen deaktiviert.

ClawHub-Installationen werden über das Gateway ausgeführt und unterliegen denselben Vertrauens-, Integritäts-
und Plugin-Installationsrichtlinienprüfungen wie andere durch das Gateway vermittelte Installationen. Das Installieren
oder Entfernen von Plugin-Code erfordert einen Neustart des Gateways. Das Aktivieren oder Deaktivieren eines
installierten Plugins kann ohne Neustart übernommen werden, wenn das Plugin und die aktuelle
Gateway-Laufzeit dies unterstützen; andernfalls meldet die UI, dass ein Neustart
erforderlich ist. OAuth-basierte MCP-Konnektoren erfordern nach dem Hinzufügen eine einmalige Ausführung von
`openclaw mcp login <name>` über die CLI.

Die Seite konzentriert sich bewusst auf Bestand, Suche, Installation, Aktivierung
und Entfernung. Verwenden Sie [`openclaw plugins`](/de/cli/plugins) für beliebige npm-, Git- oder
lokale Pfadquellen, Aktualisierungen und erweiterte Plugin-Konfiguration.

## Navigation in der Seitenleiste

Die Seitenleiste fixiert die Navigation oberhalb einer scrollbaren Sitzungsliste. In Multi-Agent-Konfigurationen erscheint jeder Agent als einklappbarer Abschnitt auf oberster Ebene. Wenn Sie einen Agent erweitern, können Sie dessen Sitzungen durchsuchen, ohne den geöffneten Chat zu verlassen; eingeklappte Agenten zeigen einen Ungelesen-Indikator. Innerhalb eines Agenten ist die Liste unterteilt in **Angeheftet**, je einen integrierten Abschnitt pro verbundenem Kanal (Telegram, Slack, WhatsApp, ...), einen integrierten Abschnitt **Arbeit** für Sitzungen, die an einen verwalteten Worktree oder eine Exec-Node gebunden sind (Zeilen zeigen eine Zeile `repo ⎇ branch` sowie den Host der Node), benutzerdefinierte Gruppen (die `category` der Sitzung) und **Chats** für alle übrigen Sitzungen. Kanal- und Arbeitsabschnitte ordnen Zeilen automatisch zu; die Zuweisung einer Sitzung zu einer benutzerdefinierten Gruppe hat immer Vorrang. Beim Öffnen einer Sitzung wird die Auswahlmarkierung verschoben, ohne die Zeilen neu anzuordnen. Sitzungen mit neuen Aktivitäten seit dem letzten Lesen zeigen einen Ungelesen-Punkt; beim Öffnen werden sie als gelesen markiert. Jede Sitzungszeile verfügt über ein Kontextmenü (Drei-Punkte-Schaltfläche oder Rechtsklick) mit Anheften/Lösen, Als ungelesen/gelesen markieren, Umbenennen, Abzweigen, In Gruppe verschieben (einschließlich Neue Gruppe und Aus Gruppe entfernen), Archivieren und Löschen; bei Touch-Layouts bleiben die direkten Steuerelemente zum Anheften und für das Menü sichtbar. Mit Cmd-/Strg-Klick schalten Sie Zeilen in einer Mehrfachauswahl um, und mit Umschalt-Klick erweitern Sie diese über die sichtbare Reihenfolge. Wenn Sie anschließend das Menü einer ausgewählten Zeile öffnen, werden Stapelaktionen angeboten (N als ungelesen/gelesen markieren, N in Gruppe verschieben, N archivieren, N löschen), die auf jede ausgewählte Sitzung angewendet werden; für das stapelweise Löschen ist nur eine Bestätigung erforderlich. Ziehen Sie eine Sitzung auf eine benutzerdefinierte Gruppe oder **Chats**, um sie zu verschieben. Kopfzeilen benutzerdefinierter Gruppen können eingeklappt, erweitert oder durch Ziehen neu angeordnet werden. Gruppennamen und ihre Reihenfolge werden im Gateway gespeichert (`sessions.groups.*`) und sind daher browserübergreifend verfügbar, während der eingeklappte Zustand im Browserprofil verbleibt. Gruppenkopfzeilen verfügen ebenfalls über ein Menü (Drei-Punkte-Schaltfläche oder Rechtsklick) mit Gruppe umbenennen, Neue Gruppe und Gruppe löschen. Beim Umbenennen oder Löschen einer Gruppe werden serverseitig alle zugehörigen Sitzungen aktualisiert, einschließlich archivierter Sitzungen. Beim Löschen einer Gruppe bleiben ihre Sitzungen erhalten und werden zurück nach Chats verschoben. Das einzelne **+** in der Kopfzeile der Sitzungsliste öffnet die Seite für eine neue Sitzung (siehe unten). Das Sortiersteuerelement verfügt außerdem über einen Schalter Gruppieren nach: Gruppiert (Standard) oder Keine für eine einzige flache Liste (**Angeheftet** bleibt separat); die Auswahl wird im aktuellen Browserprofil gespeichert. **Nutzung**, **Automatisierungen** und **Plugins** sind standardmäßig angeheftet; erweitern Sie **Mehr**, um alle anderen Ziele zu erreichen. Wählen Sie unter Mehr die Option **Angeheftete Elemente bearbeiten** aus oder klicken Sie mit der rechten Maustaste auf den Navigationsbereich, um Ziele anzuheften oder zu lösen und die Standardeinstellungen wiederherzustellen. Die angeheftete Auswahl und der Erweiterungszustand von Mehr werden im aktuellen Browserprofil gespeichert und bleiben nach dem Neuladen erhalten.

## Seite für eine neue Sitzung

Das **+** in der Kopfzeile der Sitzungsliste in der Seitenleiste öffnet unter `/new` einen ganzseitigen Entwurf: Erst beim Senden der ersten Nachricht wird etwas erstellt. Eine Zielzeile oberhalb des Nachrichtenfelds legt fest, wo die Sitzung arbeitet: der Agent (bei Multi-Agent-Konfigurationen), wo Exec ausgeführt wird (**Gateway · lokal** oder eine gekoppelte Node, die `system.run` bereitstellt; erfordert `operator.admin`), der Ordner (standardmäßig der Arbeitsbereich des Agenten; andere absolute Gateway-Pfade erfordern `operator.admin` und einen Worktree) sowie ein optionaler Schalter **Worktree** mit einer Auswahl des Basis-Branches (gestützt auf `worktrees.branches`, daher erfolgt kein Abruf) und einem optionalen Worktree-Namen (der Branch wird zu `openclaw/<name>`). Die Durchsuchen-Schaltfläche des Ordner-Chips öffnet eine eingebettete Verzeichnisauswahl, die auf der nur für Administratoren verfügbaren Methode `fs.listDir` basiert. Auf der obersten Ebene werden das Gateway und jede bekannte Node angezeigt. Offline-Nodes und Nodes ohne Unterstützung für die Verzeichnisnavigation bleiben sichtbar, sind jedoch deaktiviert. Wenn Sie das Gateway auswählen, wird beim aktuellen Ordner oder beim Home-Verzeichnis des Gateways begonnen. Wenn Sie eine geeignete Node auswählen, wird das Host-Dateisystem dieser Node durchsucht, Exec daran gebunden und der ausgewählte absolute Node-Pfad direkt verwendet (verwaltete Worktrees sind weiterhin nur auf dem Gateway verfügbar). Beim Absenden wird `sessions.create` mit der ersten Nachricht aufgerufen, sodass die Ausführung im selben Roundtrip beginnt und die Benutzeroberfläche zum Chat der neuen Sitzung wechselt. Wenn das Gateway die Sitzung erstellt, aber dieses erste Senden ablehnt, bleiben die Eingabeaufforderung und der Fehler auch nach dem Neuladen im Chat erhalten. Mit **Erneut versuchen** wird die Nachricht über die bereits erstellte Sitzung gesendet, statt eine weitere zu erstellen.

Unter **Einstellungen** beginnt die eigene Seitenleiste mit einem Feld **Einstellungen durchsuchen**, über das Sie Einstellungsabschnitte schnell finden können.

  Ein **Suchfeld** oben in der Seitenleiste öffnet die Befehlspalette (⌘K). Durch Klicken auf die OpenClaw-Marke im Kopfbereich der Seitenleiste wird der übersichtliche Startbildschirm für eine neue Sitzung geöffnet. Wenn etwas eine Aktion erfordert – fehlgeschlagene oder überfällige Cron-Aufträge, bald ablaufende oder abgelaufene Modellauthentifizierung –, erscheinen kompakte Hinweis-Chips über dem Fußbereich der Seitenleiste, die beim Anklicken zur zuständigen Seite führen. Der kompakte Fußbereich fasst Verbindungsstatus, **Einstellungen**, **Dokumentation**, Mobilgeräte-Kopplung und den Umschalter für den hellen/dunklen/systemabhängigen Farbmodus zusammen. Wenn das Gateway aus einem Quellcode-Checkout auf einem anderen Branch als `main` ausgeführt wird, zeigt der Fußbereich außerdem den Namen dieses Branches rot an, sodass ein Gateway außerhalb einer Release-Version auf einen Blick erkennbar ist (bei Release-Installationen wird er nie angezeigt). Umschalt-Befehl-Komma öffnet die **Einstellungen**, ohne das Befehl-Komma-Tastenkürzel des Browsers zu überschreiben. Der Kopfbereich der Seitenleiste enthält außerdem den Umschalter zum Einklappen (⌘B). Beim Einklappen wird die Seitenleiste vollständig ausgeblendet, sodass ein Arbeitsbereich über die gesamte Breite entsteht; ein schwebendes Steuerelement zum Ausklappen (oder ⌘B) blendet sie wieder ein. In der macOS-App befindet sich dieser Umschalter stattdessen nativ in der Titelleiste. Die Seitenleiste ist auf dem Desktop das einzige Navigationselement; es gibt keine obere Leiste. Bei schmalen Ansichtsbereichen wird die Seitenleiste durch einen einschiebbaren Drawer hinter einer kompakten Kopfzeile ersetzt, die den Drawer-Umschalter, die Marke und die Suche der Befehlspalette enthält. In der macOS-App integriert diese Kopfzeile den Freiraum der Titelleiste in einen einzigen kompakten Streifen neben den Fenstersteuerelementen. Die Navigation verwendet den regulären Browserverlauf, sodass sie mit den Zurück-/Vorwärts-Schaltflächen des Browsers durchlaufen werden kann. Die macOS-App ergänzt neben den Fenstersteuerelementen einen nativen Seitenleisten-Umschalter sowie Trackpad-Wischgesten. Bei ausgeklappter Seitenleiste befinden sich Zurück-/Vorwärts-Schaltflächen an deren rechtem Rand; bei eingeklappter Seitenleiste werden native Schaltflächen für die Suche (Befehlspalette) und eine neue Sitzung angezeigt.

  ## Was derzeit möglich ist

  <AccordionGroup>
  <Accordion title="Chat und Sprache">
    - Chatten Sie über Gateway-WS mit dem Modell (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Bei der Aktualisierung des Chatverlaufs wird ein begrenztes aktuelles Fenster mit Textobergrenzen pro Nachricht angefordert, damit große Sitzungen den Browser nicht zwingen, vor der Nutzbarkeit des Chats die vollständigen Transkriptdaten zu rendern.
    - Wenn Sie den Mauszeiger über einen öffentlichen GitHub-Issue- oder Pull-Request-Link bewegen oder ihn per Tastatur fokussieren, werden dessen Status, Titel, Autor, letzte Aktivität, Kommentare und Änderungsstatistiken angezeigt. Das verbundene Gateway ruft öffentliche Metadaten ab und speichert sie zwischen, ohne das Linkziel zu ändern – auch wenn die Benutzeroberfläche ein entferntes Gateway verwendet. Das Gateway verwendet `GH_TOKEN` oder `GITHUB_TOKEN`, sofern verfügbar, nachdem bestätigt wurde, dass das Repository öffentlich ist; andernfalls verwendet es die anonyme GitHub-API mit einem längeren Cache-Zeitraum.
    - Sprechen Sie über Echtzeitsitzungen im Browser. OpenAI verwendet direktes WebRTC, Google Live verwendet ein eingeschränktes Browser-Token zur einmaligen Verwendung über WebSocket und ausschließlich backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Vom Client verwaltete Provider-Sitzungen beginnen mit `talk.client.create`; Gateway-Relay-Sitzungen beginnen mit `talk.session.create`. Das Relay hält die Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, leitet Provider-Tool-Aufrufe von `openclaw_agent_consult` über `talk.client.toolCall` an die Gateway-Richtlinie und das größere konfigurierte OpenClaw-Modell weiter und führt die Sprachsteuerung aktiver Ausführungen über `talk.client.steer` oder `talk.session.steer`.
    - Streamen Sie Tool-Aufrufe und Karten mit Live-Tool-Ausgaben im Chat (Agent-Ereignisse). Tool-Aktivitäten werden als typabhängige Zeilen dargestellt: Shell-Befehle zeigen den syntaxhervorgehobenen Befehl mit einer Ausgabe im Terminalstil; unterstützte Bearbeitungs- und Schreibaufrufe zeigen begrenzte Inline-Diffs, soweit verfügbar Zeilennummern sowie Statistiken im Format `+added -removed`; aufeinanderfolgende Aufrufe werden zu einer Zusammenfassung wie „13 Befehle ausgeführt, 6 Dateien gelesen, 9 Dateien bearbeitet“ zusammengefasst. Während eine Ausführung aktiv ist, benennt der neueste laufende Aufruf die Gruppenüberschrift. Klappen Sie eine Zeile aus, um die übrigen Argumente und die Rohausgabe zu prüfen.
    - Optionale KI-Zwecktitel für komplexe Tool-Aufrufe (lange Shell-Befehle, Plugin-Tools mit vielen Argumenten), aktiviert mit `gateway.controlUi.toolTitles: true` (standardmäßig deaktiviert). Die Titel stammen über die Standardweiterleitung für Hilfsmodelle aus der gebündelten Methode `chat.toolTitles` – entweder aus einem expliziten `utilityModel` (vom Betreiber ausgewählter Provider, wie bei anderen Hilfsaufgaben) oder aus dem deklarierten Standard-Kleinmodell des Sitzungs-Providers – und werden Gateway-seitig pro Agent zwischengespeichert. Wenn die optionale Funktion deaktiviert ist oder kein kostengünstiges Modell verwendet werden kann, behalten die Zeilen ihre deterministischen Beschriftungen und es erfolgt kein Modellaufruf.
    - Starten oder verwerfen Sie flüchtige, vom Modell vorgeschlagene Folgeaufgaben; angenommene Vorschläge öffnen eine neue Sitzung in einem verwalteten Arbeitsbaum mit dem vorgeschlagenen Prompt.
    - Aktivitätsregisterkarte mit zuerst redigierten, browserlokalen Zusammenfassungen der Live-Tool-Aktivität aus der vorhandenen Bereitstellung von `session.tool`-/Tool-Ereignissen.

  </Accordion>
  <Accordion title="Kanäle, Sitzungen, Speicher">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und kanalspezifische Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Bei Aktualisierungen durch Kanalprüfungen bleibt der vorherige Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden; partielle Snapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit das Zeitbudget der Benutzeroberfläche überschreitet.
    - Sitzungen: Standardmäßig werden die Sitzungen konfigurierter Agenten aufgelistet. Häufig verwendete Sitzungen können angeheftet, umbenannt, archiviert oder nach Inaktivität wiederhergestellt werden. Veraltete Sitzungsschlüssel nicht konfigurierter Agenten werden durch einen Fallback behandelt. Außerdem lassen sich sitzungsspezifische Überschreibungen für Modell, Denken, Schnellmodus, Ausführlichkeit, Ablaufverfolgung und Schlussfolgern anwenden (`sessions.list`, `sessions.patch`). Angeheftete Sitzungen werden über kürzlich verwendeten, nicht angehefteten Sitzungen sortiert; archivierte Sitzungen befinden sich in der Archivansicht der Sitzungsseite und behalten ihre Transkripte. Zeilen zeigen einen Punkt für ungelesene Sitzungen mit Aktivitäten seit dem letzten Lesen und bieten Aktionen zum Markieren als ungelesen/gelesen (`sessions.patch { unread }`) sowie eine Fork-Aktion, die das Transkript in eine neue Sitzung verzweigt (`sessions.create { parentSessionKey, fork: true }`). Übersichtskacheln über der Tabelle fassen die geladene Aufstellung zusammen (Anzahl der Sitzungen, aktive Ausführungen, ungelesene Sitzungen, Token insgesamt). Jede Zeile enthält ein Symbol für die Art mit einem Punkt für eine aktive Ausführung; der Status wird als einfacher Punkt mit Beschriftung dargestellt; und die Spalte „Token“ zeigt eine Auslastungsanzeige für das Kontextfenster, wenn die Sitzung Token- und Kontextgrößen meldet. Aktionen zur Zeilenverwaltung befinden sich in einem Menü pro Zeile (Dreipunkt-Schaltfläche oder Rechtsklick), das dem Sitzungsmenü der Seitenleiste entspricht. Der Zeilen-Drawer zeigt neben den anderen Sitzungsdetails die Agent-Laufzeitumgebung und die Ausführungsdauer.
    - Sitzungsgruppierung: Mit einem Steuerelement „Gruppieren nach“ wird die Sitzungstabelle nach benutzerdefinierten Gruppen, Kanal, Art, Agent oder Datum in Abschnitte gegliedert. Benutzerdefinierte Gruppen bleiben über `sessions.patch` (`category`) sitzungsbezogen erhalten, sodass auch Sitzungen kategorisiert werden können, die über Nachrichtenkanäle (Discord, Telegram, WhatsApp, ...) gestartet wurden. Weisen Sie Gruppen zu, indem Sie Zeilen auf einen Abschnitt ziehen oder die Gruppenauswahl der jeweiligen Zeile verwenden, und erstellen Sie Gruppen mit der Aktion „Neue Gruppe“.
    - Speicher (eine auf den ausgewählten Agenten beschränkte Registerkarte auf der Agentenseite): Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Leser für das Traumtagebuch (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Aufgaben, Plugins, Skills, Geräte, Ausführungsgenehmigungen">
    - Automatisierungen (Cron-Jobs): Statistikkarten (Anzahl der Automatisierungen, Anzahl der fehlgeschlagenen Automatisierungen, Scheduler-Status, nächster Aktivierungszeitpunkt) über einem Tab-Umschalter zwischen Automatisierungen und Ausführungsverlauf; der Tab „Automatisierungen“ listet Jobs in einer filterbaren Tabelle auf (Alle/Aktiv/Pausiert, Suche, Zeitplan- und Filter für die letzte Ausführung, Aktionsmenü pro Zeile) und zeigt darunter Vorschläge für den Einstieg, während der Tab „Ausführungsverlauf“ die letzten Ausführungen aller Automatisierungen anzeigt (`cron.*`).
    - Aufgaben: Live-Übersicht aktiver und kürzlich ausgeführter Hintergrundaufgaben mit verknüpften Sitzungen und Abbruchmöglichkeit (`tasks.*`).
    - Plugins: Installierten Bestand und kuratierten Store durchsuchen, ClawHub durchsuchen, Plugin-Code installieren und entfernen sowie installierte Plugins aktivieren oder deaktivieren (`plugins.*`); MCP-Serverzeilen bearbeiten `mcp.servers` über die Konfigurationsmethoden.
    - Skills: Status, Aktivieren/Deaktivieren, Installation, Aktualisierungen von API-Schlüsseln (`skills.*`).
    - Geräte: Eine Bestandsübersicht führt Datensätze gekoppelter Geräte, den Node-Katalog und die Live-Anwesenheit zusammen (`device.pair.list`, `node.list`, `system-presence`). Der Gateway-Host ist an erster Stelle angeheftet; gekoppelte Clients zeigen Verbindungsstatus, Rollen, Token, Fähigkeiten und Befehle. Doppelte Kopplungen werden zu einer aufklappbaren Gruppe zusammengefasst, und **N veraltete Einträge bereinigen** entfernt gesammelt vom Administrator bestätigte Offline-Duplikate, die automatisch genehmigt wurden (stilles lokales Verfahren, vertrauenswürdiger CIDR-Bereich oder SSH-verifiziert) oder vor der Erfassung des Genehmigungsursprungs angelegt wurden. Einträge können entfernt (`node.pair.remove`, `device.pair.remove`), Gerätekopplungen und erneute Node-Genehmigungen direkt bearbeitet (`device.pair.*`, `node.pair.approve`/`reject`) und Codes zur mobilen Einrichtung über dieselbe Karte erstellt werden.
    - Ausführungsgenehmigungen: Gateway- oder Node-Zulassungslisten und die Abfragerichtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Profil: Eine Einstellungsseite, die die Identität des Standard-Agenten mit Nutzungsstatistiken über den gesamten Zeitraum anzeigt – Token über die gesamte Laufzeit, Spitzentag, längste Sitzung, Aktivitätsserien, eine Token-Heatmap für ein Jahr, meistgenutzte Tools und Kanal-Highlights (`usage.cost`, `sessions.usage`).
    - MCP verfügt über eine eigene Einstellungsseite mit schreibgeschützten Serverzeilen (Transport, Aktivierung, OAuth-/Filter-/Parallelitätszusammenfassungen), gängigen Operatorbefehlen und dem auf `mcp` begrenzten Konfigurationseditor; Server werden auf der Seite „Plugins“ hinzugefügt, aktiviert/deaktiviert und entfernt.
    - Modell-Provider: Eine Einstellungsseite, die jeden konfigurierten Modell-Provider mit seinem Markensymbol, Authentifizierungsstatus (`models.authStatus`), der Modellverfügbarkeit (`models.list`), Live-Daten zu Tarif/Kontingent/Abrechnung, sofern der Provider diese meldet (`usage.status`), und den lokalen Sitzungsausgaben der letzten 30 Tage (`sessions.usage`) auflistet. Die Aktion „Aktualisieren“ liest den Anmeldedatenstatus und die Provider-Nutzung erneut ein.
    - Verbindung: Eine Einstellungsseite (unter **Verbindungen**), die die eigene Gateway-Verbindung des Dashboards verwaltet – WebSocket-URL, Gateway-Token, Passwort und Standardsitzungsschlüssel – sowie den neuesten Handshake-Snapshot (Status, Betriebszeit, Tick-Intervall, letzte Kanalaktualisierung). Die Offline-Anmeldesperre behandelt den Fall einer getrennten Verbindung; diese Seite bearbeitet die Verbindung im verbundenen Zustand.
    - Mit Validierung anwenden und neu starten (`config.apply`), anschließend die zuletzt aktive Sitzung aktivieren.
    - Schreibvorgänge enthalten eine Schutzprüfung des Basis-Hashs, um das Überschreiben gleichzeitiger Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Referenzen in den übermittelten Konfigurationsdaten; nicht aufgelöste aktive, übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Beim Speichern von Formularen werden veraltete geschwärzte Platzhalter verworfen, die nicht aus der gespeicherten Konfiguration wiederhergestellt werden können, während geschwärzte Werte erhalten bleiben, die weiterhin gespeicherten Geheimnissen zugeordnet sind.
    - Schema und Formulardarstellung stammen aus `config.schema` / `config.schema.lookup`, einschließlich der Felder `title`/`description`, übereinstimmender UI-Hinweise, unmittelbarer Zusammenfassungen untergeordneter Elemente, Dokumentationsmetadaten für verschachtelte Objekt-/Platzhalter-/Array-/Kompositionsknoten sowie Plugin- und Kanalschemas, sofern verfügbar. Der Raw-JSON-Editor ist nur verfügbar, wenn der Snapshot einen sicheren Raw-Roundtrip unterstützt; andernfalls erzwingt die Control UI den Formularmodus.
    - „Auf gespeicherten Stand zurücksetzen“ im Raw-JSON-Editor bewahrt die ursprünglich im Rohformat erstellte Struktur (Formatierung, Kommentare, `$include`-Layout), anstatt einen vereinfachten Snapshot neu darzustellen, sodass externe Änderungen eine Zurücksetzung überstehen, wenn der Snapshot sicher einen Roundtrip durchlaufen kann.
    - Strukturierte SecretRef-Objektwerte werden in Texteingabefeldern des Formulars schreibgeschützt dargestellt, um eine versehentliche Beschädigung durch Umwandlung eines Objekts in eine Zeichenfolge zu verhindern.

  </Accordion>
  <Accordion title="Nutzung">
    - Die aus Sitzungen abgeleitete Analyse von Token und geschätzten Kosten bleibt von der Provider-Abrechnung getrennt.
    - Provider-Karten rufen `usage.status` auf und zeigen Live-Tarifnamen, Kontingentzeiträume, Guthaben, Ausgaben und Budgets an, die von konfigurierten Provider-Plugins gemeldet werden.
    - Ein Fehler bei der Provider-Nutzung blockiert das Sitzungs-/Kostendashboard nicht; nicht verfügbare Provider-Karten zeigen ihren eigenen Fehlerstatus an.

  </Accordion>
  <Accordion title="Debugging, Protokolle, Aktualisierung">
    - Debugging: Snapshots zu Status/Systemzustand/Modellen, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Aktualisierungs-/RPC-Zeitmessungen der Control UI, Zeitmessungen für langsame Chat-/Konfigurationsdarstellungen und Einträge zur Browser-Reaktionsfähigkeit bei langen Animationsframes oder lang laufenden Aufgaben, wenn der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Protokolle: Live-Anzeige der letzten Einträge in Gateway-Dateiprotokollen mit Filter/Export (`logs.tail`).
    - Aktualisierung: Eine Paket-/Git-Aktualisierung samt Neustart (`update.run`) mit Neustartbericht ausführen und anschließend nach dem erneuten Verbinden `update.status` abfragen, um die laufende Gateway-Version zu überprüfen.

  </Accordion>
  <Accordion title="Hinweise zum Automatisierungsbereich">
    - Durch Auswählen einer Zeile wird eine ganzseitige Detailansicht mit einem Aktiv/Pausiert-Schalter und „Jetzt ausführen“ in der Kopfzeile geöffnet („Bei Fälligkeit ausführen“, „Klonen“ und „Entfernen“ befinden sich im zugehörigen Menü); der Tab „Einstellungen“ bearbeitet die Automatisierung direkt (Prompt, Details, Häufigkeit, erweiterte Überschreibungen), und der Tab „Ausführungsverlauf“ zeigt die Ausführungen dieser Automatisierung.
    - Die Automatisierungsvorlagen unter der Tabelle füllen das Erstellungsformular mit einem bearbeitbaren Prompt und Zeitplan vorab aus.
    - Bei isolierten Aufgaben wird die Zustellung standardmäßig als Zusammenfassung angekündigt; wählen Sie „Keine“ für ausschließlich interne Ausführungen.
    - Felder für Kanal/Ziel werden angezeigt, wenn „Ankündigen“ ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"`, wobei `delivery.to` auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Aufgaben der Hauptsitzung sind die Zustellmodi Webhook und „Keine“ verfügbar.
    - Zu den erweiterten Bearbeitungsoptionen gehören das Löschen nach der Ausführung, das Löschen der Agentenüberschreibung, Optionen für exakte/gestaffelte Cron-Ausführung, Überschreibungen für Agentenmodell/Denken und Umschalter für die Best-Effort-Zustellung.
    - Die Formularvalidierung erfolgt direkt mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Speichern-Schaltfläche, bis sie korrigiert wurden.
    - Legen Sie `cron.webhookToken` fest, um ein dediziertes Bearer-Token zu senden; wird es weggelassen, wird der Webhook ohne Authentifizierungsheader gesendet.
    - `cron.webhook` ist ein veralteter Legacy-Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Jobs, die noch `notify: true` verwenden, auf eine explizite Webhook- oder Abschlusszustellung pro Job zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operatoransicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet MCP-Transporte nicht selbstständig; verwenden Sie sie, um gespeicherte Konfigurationen zu prüfen und zu bearbeiten, und führen Sie anschließend `openclaw mcp doctor --probe` aus, wenn Sie einen Live-Nachweis des Servers benötigen.

Typischer Arbeitsablauf:

1. Öffnen Sie **MCP** in der Seitenleiste.
2. Prüfen Sie die Zusammenfassungskarten auf die Gesamtzahl sowie die Anzahl aktivierter, OAuth-verwendender und gefilterter Server.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierung, Authentifizierung, Filter, Zeitüberschreitungen und Befehlshinweise.
4. Verwalten Sie Server (hinzufügen, aktivieren/deaktivieren, entfernen) auf der Seite **Plugins**, die als einzige interaktiv in `mcp.servers` schreibt; die Zeilenliste hier verlinkt dorthin.
5. Bearbeiten Sie den begrenzten Konfigurationsabschnitt `mcp` für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Toolfilter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern und veröffentlichen**, wenn der laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, um statische Diagnosen, einen Live-Nachweis oder das Verwerfen der zwischengespeicherten Laufzeitdaten durchzuführen.

Die Seite schwärzt URLs ähnelnde Werte, die Anmeldedaten enthalten, vor der Darstellung und setzt Servernamen in Befehlsauszügen in Anführungszeichen, damit kopierte Befehle auch bei Leerzeichen oder Shell-Metazeichen funktionieren. Vollständige CLI- und Konfigurationsreferenz: [MCP](/de/cli/mcp).

## Tab „Aktivität“

Der Tab „Aktivität“ befindet sich unter **Einstellungen › System** neben „Protokolle“ und „Debugging“. Er ist ein flüchtiger, browserlokaler Beobachter für Live-Toolaktivitäten, der aus demselben Gateway-Ereignisstrom `session.tool` / Tool-Ereignisstrom abgeleitet wird, der die Toolkarten im Chat versorgt. Er fügt keine weitere Gateway-Ereignisfamilie, keinen Endpunkt, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachterstrom hinzu.

Aktivitätseinträge enthalten nur bereinigte Zusammenfassungen sowie geschwärzte und gekürzte Ausgabevorschauen. Werte von Toolargumenten werden nicht im Aktivitätsstatus gespeichert; die UI zeigt an, dass Argumente ausgeblendet sind, und zeichnet nur die Anzahl der Argumentfelder auf. Die In-Memory-Liste ist an den aktuellen Browser-Tab gebunden, bleibt bei der Navigation innerhalb der Control UI erhalten und wird beim Neuladen der Seite, beim Sitzungswechsel oder durch **Löschen** zurückgesetzt.

## Operator-Terminal

Das andockbare Operator-Terminal ist standardmäßig deaktiviert. Um es zu aktivieren, setzen Sie `gateway.terminal.enabled: true` und starten Sie den Gateway neu. Das Terminal erfordert eine `operator.admin`-Verbindung und öffnet ein Host-PTY im Arbeitsbereich des aktiven Agenten. Neue Tabs folgen dem aktuell ausgewählten Chat-Agenten.

<Warning>
Das Terminal ist eine uneingeschränkte Host-Shell und übernimmt die Umgebung des Gateway-Prozesses. Aktivieren Sie es nur für vertrauenswürdige Operatorbereitstellungen. OpenClaw verweigert Terminalsitzungen für Agenten mit `sandbox.mode: "all"`; wenn Sie einen aktiven Agenten in diesen Modus versetzen, werden dessen bestehende und gerade aufgebauten Terminalsitzungen geschlossen.
</Warning>

Verwenden Sie **Strg + Backtick**, um das Dock ein- oder auszublenden. Das Layout unterstützt das Andocken unten und rechts, passt seine Größe an den Browser-Viewport an und verwaltet mehrere Shell-Tabs. Informationen zu `gateway.terminal.enabled` und der optionalen Überschreibung `gateway.terminal.shell` finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration-reference#gateway).

Sitzungen überstehen Verbindungsabbrüche: Beim Neuladen einer Seite, Versetzen des Laptops in den Ruhezustand oder bei einer kurzen Netzwerkunterbrechung wird die Sitzung auf dem Gateway getrennt, statt beendet zu werden, und derselbe Browser-Tab verbindet sich beim erneuten Verbindungsaufbau wieder und gibt die letzten Ausgaben erneut wieder. Getrennte Sitzungen werden nach `gateway.terminal.detachedSessionTimeoutSeconds` beendet (Standardwert 300 Sekunden; `0` stellt das Beenden bei Verbindungsabbruch wieder her). `terminal.list` zeigt Sitzungen an, die verbunden werden können, `terminal.attach` übernimmt eine davon (Übernahme im tmux-Stil), und `terminal.text` liest die letzten Ausgaben einer Sitzung als Klartext, ohne eine Verbindung herzustellen – eine Funktion für Agenten und Tools.

Das Terminal ist außerdem als bildschirmfüllendes, ausschließlich das Terminal enthaltendes Dokument unter `/?view=terminal` verfügbar. Die iOS- und Android-Apps betten diese Seite in ihre Terminalansichten ein und verwenden dabei die gespeicherten Gateway-Anmeldedaten erneut; die Verfügbarkeit unterliegt denselben Voraussetzungen `gateway.terminal.enabled` und `operator.admin`, und die Seite zeigt einen Hinweis an, wenn der verbundene Gateway das Terminal nicht bereitstellt.

## Browserbereich

Die Control UI enthält einen andockbaren Browserbereich, der den vom Gateway gesteuerten Browser (denselben, den Agenten über das [Browser-Tool](/de/tools/browser-control) steuern) in jedem normalen Webbrowser darstellt – eine native WebView ist nicht erforderlich. Er wird angezeigt, wenn der verbundene Gateway einer `operator.admin`-Verbindung `browser.request` bekannt gibt; die Globus-Schaltfläche in der Arbeitsbereichsleiste der Sitzung blendet ihn ein oder aus. Der Bereich zeigt einen Live-Snapshot der Seite mit Tabs, einer bearbeitbaren URL-Leiste, Zurück/Vorwärts/Neu laden und „In Ihrem Browser öffnen“, lässt sich rechts oder unten andocken und leitet Klicks, Scrollen mit dem Mausrad und grundlegende Tastatureingaben an die entfernte Seite weiter.

Zwei Erfassungsmodi stellen den Seitenkontext für den Agenten zusammen:

- **Kommentieren (Stift)**: Zeichnen Sie Freihandmarkierungen über die Seite. **An Chat senden** fügt die Striche in den Screenshot ein, hängt das Bild an das Eingabefeld des aktiven Chats an und füllt eine Beschreibung der Seiten-URL, des Titels und jedes markierten Bereichs vorab aus, damit der Agent genau weiß, was Sie eingekreist haben.
- **Untersuchen (Zeiger)**: Bewegen Sie den Mauszeiger über ein Element, um Details zum Element unter dem Cursor anzuzeigen (Selektor, barrierefreier Name, Rolle, Größe); klicken Sie, um die Details dieses Elements zusammen mit einem hervorgehobenen Screenshot über denselben Eingabefeld-Ablauf zu senden. Untersuchen, Scrollen mit dem Mausrad sowie Zurück/Vorwärts erfordern `browser.evaluateEnabled` (standardmäßig aktiviert).

Die macOS-App behält ihre native Link-Browser-Seitenleiste für Links bei, die im Dashboard angeklickt werden. Das Browser-Panel funktioniert dort ebenfalls und ermöglicht das Kommentieren von Seiten auf allen anderen Plattformen.

## Chatverhalten

  <AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Es bestätigt sofort mit `{ runId, status: "started" }`, und die Antwort wird über `chat`-Ereignisse gestreamt. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Zeitmetadaten für die lokale Diagnose erhalten.
    - Chat-Uploads akzeptieren Bilder sowie Dateien, die keine Videos sind. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - Antworten von `chat.history` sind zur Sicherheit der Benutzeroberfläche größenbeschränkt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter (`[chat.history omitted: message too large]`) ersetzen.
    - Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann die Seitenansicht den vollständigen, für die Anzeige normalisierten Transkripteintrag bei Bedarf über `chat.message.get` anhand von `sessionKey`, falls erforderlich der aktiven `agentId`, und der Transkript-`messageId` abrufen. Wenn der Gateway weiterhin keine weiteren Inhalte zurückgeben kann, zeigt die Ansicht ausdrücklich an, dass diese nicht verfügbar sind, statt stillschweigend erneut die gekürzte Vorschau anzuzeigen.
    - Vom Assistenten erzeugte Bilder werden als Referenzen auf verwaltete Medien dauerhaft gespeichert und über authentifizierte Gateway-Medien-URLs bereitgestellt, sodass ein erneutes Laden nicht davon abhängt, dass rohe Base64-Bildnutzdaten in der Antwort des Chatverlaufs verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI ausschließlich für die Anzeige bestimmte Inline-Direktiven-Tags aus dem sichtbaren Assistententext (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modellsteuerungstoken. Sie lässt Assistenteneinträge aus, deren gesamter sichtbarer Text ausschließlich aus dem exakten Stille-Token `NO_REPLY` / `no_reply` oder dem Heartbeat-Bestätigungstoken `HEARTBEAT_OK` besteht.
    - Während eines aktiven Sendevorgangs und der abschließenden Aktualisierung des Verlaufs hält die Chatansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, falls `chat.history` kurzzeitig einen älteren Schnappschuss zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse stellen den Zustellstatus dar, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach abschließenden Tool-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist unter [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für reine UI-Aktualisierungen (kein Agentenlauf, keine Kanalzustellung).
    - Die Seitenleiste führt jede geladene aktive Sitzung nach Agentenabschnitt und den Bereichen „Angeheftet“, „Kanal“, „Arbeit“, „Benutzerdefiniert“ und „Chats“ auf und bietet eine einzige Aktion „Neue Sitzung“, die den Entwurfsdialog öffnet. Das Öffnen einer sichtbaren Zeile verschiebt nur die Hervorhebung. Benutzerdefinierte Gruppen können eingeklappt und per Drag-and-drop neu angeordnet werden, und Sitzungen können auf eine Gruppe oder „Chats“ gezogen werden; Gruppennamen und Reihenfolge werden über den Gateway synchronisiert, während der eingeklappte Zustand im Browser verbleibt. Eine neue Dashboard-Sitzung erhält asynchron einen prägnanten generierten Titel aus ihrer ersten Nachricht, die kein Befehl ist; explizite Namen werden niemals ersetzt. Legen Sie `agents.defaults.utilityModel` (oder `agents.list[].utilityModel`) fest, um diesen separaten Modellaufruf an ein kostengünstigeres Modell weiterzuleiten. Wenn Sie einen anderen Agentenabschnitt erweitern, können Sie die Sitzungen dieses Agenten durchsuchen, ohne den geöffneten Chat zu verlassen.
    - Die Sitzungssuche befindet sich in der Befehlspalette (⌘K oder das Suchfeld oben in der Seitenleiste): Bei Eingabe einer Suchanfrage wird eine begrenzte Anzahl übereinstimmender Seiten über Agenten hinweg durchsucht, interne untergeordnete/Cron-Zeilen werden herausgefiltert und sichtbare Treffer neben Navigationsbefehlen aufgelistet. Die Seite „Sitzungen“ enthält weiterhin die vollständige durchsuchbare Liste mit Filtern.
    - Jede Zeile der Seitenleiste bietet weiterhin direkten Zugriff auf das Anheften sowie ein vollständiges Kontextmenü für den Ungelesen-Status, Umbenennen, Forken, Gruppieren, Archivieren und Löschen. Mehrfach ausgewählte Zeilen (Cmd-/Ctrl-Klick, Umschalt-Klick für Bereiche) erhalten ein Stapelmenü für den Ungelesen-Status, die Gruppierung, Archivierung und Löschung; die Stapelarchivierung/-löschung bleibt deaktiviert, sofern nicht jede ausgewählte Sitzung archiviert werden kann. Ein aktiver Lauf und die Hauptsitzung eines Agenten können nicht archiviert werden. Wenn die aktuell ausgewählte Sitzung archiviert oder gelöscht wird, wechselt „Chat“ zurück zur Hauptsitzung dieses Agenten.
    - In der macOS-App verwendet das OpenClaw-Zeichen den ansonsten leeren nativen Titelleistenbereich neben den Fenstersteuerelementen, statt eine Zeile in der Seitenleiste zu belegen.
    - Bei Desktopbreiten bleiben die Chatsteuerelemente in einer einzigen kompakten Zeile und werden beim Abwärtsscrollen im Transkript eingeklappt; Aufwärtsscrollen, die Rückkehr zum Anfang oder das Erreichen des Endes stellt die Steuerelemente wieder her.
    - Aufeinanderfolgende identische reine Textnachrichten werden als eine Sprechblase mit einem Zähler-Badge dargestellt. Nachrichten mit Bildern, Anhängen, Tool-Ausgaben oder Canvas-Vorschauen werden nicht zusammengefasst.
    - Wenn sich der Checkout einer Sitzung auf einem Nicht-Standard-Branch eines GitHub-Repositorys befindet, heftet die Chatansicht Pull-Request-Chips oberhalb des Eingabebereichs an: PR-Nummer, Repository, Branch, Diff-Anzahlen, eine CI-Kapsel sowie Entwurfs-/Zusammengeführt-/Geschlossen-Status, jeweils mit einem Link zum PR. Die Zeile zeigt höchstens zwei Chips – Live-PRs (offen/Entwurf) zuerst – und eine Schaltfläche „Mehr anzeigen“ blendet den eingeklappten Verlauf zusammengeführter/geschlossener PRs ein. Die CI-Kapsel öffnet ein kleines CI-Überwachungs-Popover mit der Anzahl erfolgreicher/fehlgeschlagener/laufender/übersprungener Prüfungen und einem Link zur Prüfungsseite des PRs. Die Erkennung erfolgt serverseitig über `controlUi.sessionPullRequests`, das die `GH_TOKEN`/`GITHUB_TOKEN` des Gateways wiederverwendet, sofern sie festgelegt sind. Wenn das Ratenlimit der GitHub-API erreicht ist, behalten die Chips den zuletzt bekannten Status bei und zeigen eine Warnung an, dass der Status möglicherweise veraltet ist; durch Verwerfen eines Chips wird er für diese Sitzung im aktuellen Browserprofil ausgeblendet. Bevor ein PR vorhanden ist, zeigt die Zeile den Branch selbst an – Repository, Branchname und die +/−-Größe des Diffs gegenüber der Merge-Basis des Standard-Branchs (committete und nicht committete Arbeit) – sowie eine Schaltfläche „PR erstellen“, die GitHubs Seite für neue Pull Requests öffnet. Die Zeile erscheint, sobald der gepushte Branch vergleichbare Commits enthält, und blendet sich aus, solange ein offener PR oder PR-Entwurf vorhanden ist. Die Branchzeile stammt ausschließlich aus dem lokalen Git und bleibt daher auch bei einer Ratenbegrenzung durch GitHub verfügbar; sie zeigt dieselbe Warnung vor einem möglicherweise veralteten Status, da „kein PR gefunden“ erst nach Zurücksetzen des Limits als verlässlich gelten kann.
    - Das Sitzungs-Diff-Panel zeigt, was der Checkout einer Sitzung tatsächlich geändert hat: Die Branch-Schaltfläche (im Kopfbereich der Arbeitsbereichsleiste, im Kopfbereich des geteilten Fensters oder als schwebende Schaltfläche im Chat mit einem Fenster) öffnet das Detailpanel mit einem Diff pro Datei für Branch-, nicht committete und nicht nachverfolgte Änderungen gegenüber der Merge-Basis des Standard-Branchs des Checkouts – Statuspunkt, Umbenennungspfeil, +/−-Anzahlen pro Datei, einklappbare Dateien und Markierungen für „N unveränderte Zeilen“ zwischen Hunk-Abschnitten. Diffs werden serverseitig über die Gateway-Methode `sessions.diff` (Geltungsbereich `operator.read`) berechnet; Binärdateien und übergroße Dateien werden auf reine Statistikeinträge reduziert, und die Schaltfläche wird nur angezeigt, wenn der verbundene Gateway `sessions.diff` ankündigt.
    - Die Sitzungs-Arbeitsbereichsleiste in jedem Chatfenster führt Sitzungsdateien, Projektdateien und Artefakte auf. Standardmäßig ist sie am rechten Rand des Fensters angedockt; ziehen Sie ihren Kopfbereich (oder verwenden Sie die Andockschaltfläche), um sie nach unten zu verschieben. Die Auswahl wird im aktuellen Browserprofil gespeichert. Eine eingeklappte Leiste belegt überhaupt keinen Platz: Öffnen Sie sie mit ⇧⌘B, dem Dateischalter im Kopfbereich des geteilten Fensters oder der schwebenden Dateischaltfläche im Chat mit einem Fenster erneut (beide tragen ein Badge mit der Anzahl geänderter Dateien). Das separate Detailpanel für Dateien, Tools und Canvas bleibt davon unberührt.
    - Wenn Sie im Chat auf eine Dateireferenz, in einer erweiterten Tool-Karte zum Lesen/Bearbeiten/Schreiben auf einen Dateipfad oder in der Arbeitsbereichsleiste auf eine Dateizeile klicken, wird das Datei-Detailpanel geöffnet: eine Codeansicht auf CodeMirror-Basis mit Syntaxhervorhebung, Zeilennummern, Sprung zu einer Zeile, dateiinterner Suche, Kopieraktionen und einem Menü zum Öffnen in einem externen Editor. Wenn der Gateway gegenüber einer Verbindung mit `operator.admin` `sessions.files.set` ankündigt, fügt das Panel einen Bearbeitungsmodus mit Änderungsverfolgung und Speichern per Cmd/Ctrl-S hinzu; nicht gespeicherte Entwürfe überdauern Datei-, Panel- und Sitzungsnavigation im aktuellen Browser-Tab, bis sie ausdrücklich gespeichert oder verworfen werden. Speichervorgänge verwenden Compare-and-Swap mit einem von `sessions.files.get` zurückgegebenen Inhalts-Hash: Wenn die Datei seit dem Laden auf dem Datenträger geändert wurde (zum Beispiel weil der Agent weitergearbeitet hat), zeigt das Panel einen Konflikthinweis mit den Aktionen „Neu laden“ (neuesten Inhalt übernehmen) und „Überschreiben“ (lokale Bearbeitung beibehalten). Schreibvorgänge durchlaufen dieselben dateisystemsicheren Arbeitsbereichsschutzprüfungen wie Lesevorgänge – Pfadbegrenzung, Ablehnung von symbolischen und festen Links sowie ein UTF-8-Limit von 256 KB – und überschreiben ausschließlich vorhandene Dateien; der Editor erstellt oder löscht niemals Dateien.
    - Die Leiste für Hintergrundaufgaben in jedem Chatfenster führt die Hintergrundaufgaben und Subagenten des aktuellen Agenten auf (`tasks.list`, nach Agent gefiltert und durch `task`-Ereignisse aktuell gehalten): Laufende Arbeit zeigt einen live aktualisierten Zeitgeber für die verstrichene Zeit, die Anzahl der Tool-Verwendungen, das aktuell verwendete Tool und ein Steuerelement zum Anhalten; der einklappbare Abschnitt für abgeschlossene Aufgaben ergänzt Laufzeiten; und ein Link „Transkript anzeigen“ öffnet die untergeordnete Sitzung der Aufgabe im Fenster. Öffnen Sie sie mit dem Aktivitätsschalter im Kopfbereich des geteilten Fensters oder der schwebenden Aktivitätsschaltfläche im Chat mit einem Fenster – der Aufgabenschnappschuss wird vorab geladen, sodass beide ein Badge mit der Anzahl laufender Aufgaben anzeigen, ohne dass die Leiste zuerst geöffnet werden muss. Die Seite „Aufgaben“ bleibt das vollständige agentenübergreifende Verzeichnis.
    - Die Arbeitsbereichsleiste, die Leiste für Hintergrundaufgaben und das Detailpanel passen sich an die jeweilige Breite jedes Fensters statt an die Fensterbreite an: In einem schmalen Fenster oder einem kompakten Gesamtfenster werden beide Leisten als untere Streifen dargestellt (Steuerelemente zum seitlichen Andocken werden ausgeblendet, bis das Fenster breiter wird; die Arbeitsbereichsleiste hat Vorrang auf dem seitlichen Platz, wenn nur eine Spalte hineinpasst), und das Detailpanel wird unterhalb des Threads mit einem horizontalen Griff zur Größenänderung gestapelt, statt die Zeile mit ihm zu teilen. Ansichtsbereiche in Telefongröße öffnen das Detailpanel weiterhin im Vollbildmodus.
    - Die Modell- und Denkmodus-Auswahlfelder im Chatkopf aktualisieren die aktive Sitzung sofort über `sessions.patch`; sie sind dauerhafte Sitzungsüberschreibungen und keine Sendeoptionen, die nur für einen Durchlauf gelten.
    - **Geteilte Ansicht:** Öffnen Sie sie über die schwebende Schalterzeile oben rechts (neben den Schaltern für Sitzungs-Diff, Hintergrundaufgaben und Sitzungsdateien) und teilen Sie anschließend das aktive Fenster nach rechts oder unten, bis so viele Fenster vorhanden sind, wie hineinpassen. Jedes Fenster besitzt eine eigene Sitzung, ein eigenes Transkript, einen eigenen Eingabebereich und einen eigenen Tool-Stream.
    - Ziehen Sie eine Sitzung aus der Seitenleiste in den Chat, um sie in einem Fenster zu öffnen. Eine animierte Ablagevorschau gleitet zwischen Zonen und kennzeichnet das Ergebnis – „Teilen“ über genau der Hälfte, die ein neues Fenster einnehmen wird, „Hier öffnen“ über einem vollständigen Fenster – und das Ablegen funktioniert auch im Modus mit einem Fenster.
    - Das aktive geteilte Fenster steuert die Auswahl in der Seitenleiste und die URL. Jedes Fenster besitzt eine eigene Kopfzeile mit dem Sitzungstitel sowie Steuerelementen für die Arbeitsbereichsleiste, das Teilen und Schließen; Trennlinien ändern die Größe von Spalten und gestapelten Fenstern, und der Browser speichert das Layout lokal über Neuladungen hinweg.
    - Auf schmalen Bildschirmen behält die geteilte Ansicht das Layout bei, stellt jedoch nur das aktive Fenster dar, einschließlich seiner Kopfzeile mit dem Steuerelement zum Schließen.
    - Wenn Sie eine Nachricht senden, während eine Änderung der Modellauswahl für dieselbe Sitzung noch gespeichert wird, wartet der Eingabebereich auf diesen Sitzungspatch, bevor `chat.send` aufgerufen wird, sodass beim Senden das ausgewählte Modell verwendet wird.
    - Die Eingabe von `/new` erstellt dieselbe neue Dashboard-Sitzung wie „Neuer Chat“ und wechselt zu ihr, außer wenn `session.dmScope: "main"` konfiguriert ist und die aktuelle übergeordnete Sitzung die Hauptsitzung des Agenten ist; dann wird die Hauptsitzung direkt zurückgesetzt. Die Eingabe von `/reset` behält das explizite direkte Zurücksetzen des Gateways für die aktuelle Sitzung bei.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateways an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Zulassungsliste die Auswahl, einschließlich `provider/*`-Einträgen, durch die Provider-bezogene Kataloge dynamisch bleiben. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit verwendbarer Authentifizierung an. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn aktuelle Nutzungsberichte der Gateway-Sitzung die aktuelle Anzahl der Kontext-Token enthalten, zeigt die Symbolleiste des Chat-Eingabefelds einen kleinen Ring für die Kontextnutzung mit dem verwendeten Prozentsatz an. Öffnen Sie den Ring, um das aktuelle Kontextfenster, die Token-Anzahlen des letzten Durchlaufs und die geschätzten Gesamtkosten, die Provider-/Modellidentität sowie – sofern gemeldet – die Aufschlüsselung der Eingabe-, Ausgabe- und Cache-Kosten der neuesten Provider-Antwort anzuzeigen. Bei hoher Kontextauslastung wechselt der Ring zu einem Warnungsstil und zeigt bei empfohlenen Compaction-Schwellenwerten eine kompakte Schaltfläche an, die den normalen Compaction-Pfad der Sitzung ausführt. Veraltete Token-Momentaufnahmen werden ausgeblendet, bis das Gateway erneut aktuelle Nutzungsdaten meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` sowie einem `openai`-API-Schlüsselprofil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`. OpenAI Realtime verwendet die öffentliche Platform API und erfordert einen Platform-API-Schlüssel; eine Codex-OAuth-Anmeldung reicht für diese Schnittstelle nicht aus. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` sowie `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen regulären Provider-API-Schlüssel: OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC, und Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Tool-Deklarationen durch den Gateway im Token festgeschrieben werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, werden über den Gateway-Relay-Transport ausgeführt, sodass Zugangsdaten und Provider-Sockets serverseitig verbleiben, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Prompt der Realtime-Sitzung wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Überschreibungen der Anweisungen.

    Dauerhafte Standardwerte für Provider, Modell, Stimme, Transport, Reasoning-Aufwand, exakten VAD-Schwellenwert, Stilledauer und Präfix-Padding befinden sich unter **Einstellungen → Kommunikation → Sprechen**; Änderungen erfordern `operator.admin`-Zugriff. Die Konfiguration des Gateway-Relays erzwingt den Backend-Relay-Pfad; bei der Konfiguration von WebRTC verbleibt die Sitzung unter Kontrolle des Clients und schlägt fehl, statt stillschweigend auf das Relay zurückzufallen, wenn der Provider keine Browser-Sitzung erstellen kann.

    Das Bedienelement für Sprechen ist die Mikrofonschaltfläche in der Composer-Symbolleiste. Ihr Aufklappmenü listet **System default** und jedes vom Browser bereitgestellte Mikrofon auf, einschließlich USB-, Bluetooth- und virtueller Eingänge. Die ausgewählte Geräte-ID bleibt lokal im Browser und wird niemals an den Gateway gesendet; wenn genau dieses Gerät nicht mehr verfügbar ist, fordert Sprechen Sie auf, einen anderen Eingang auszuwählen, statt stillschweigend über ein anderes Mikrofon aufzunehmen. Während Sprechen aktiv ist, wird die Mikrofonschaltfläche zu einer pillenförmigen Anzeige mit dem aktuellen Eingangspegel; ein Klick darauf beendet die Spracheingabe, und beim Darüberfahren wird das Stopp-Symbol eingeblendet. Screenreader geben `Connecting voice input...`, `Listening...` oder `Asking OpenClaw...` aus, während ein Echtzeit-Tool-Aufruf über `talk.client.toolCall` das konfigurierte größere Modell abfragt. Das Stoppen einer laufenden Agentenantwort bleibt ein separates quadratisches Bedienelement **Stopp** neben der pillenförmigen Anzeige.

    Live-Smoke-Test für Maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` überprüft die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung des Google-Live-Browser-WebSockets mit eingeschränktem Token und den Gateway-Relay-Browseradapter mit simulierten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stopp** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgeanfragen in die Warteschlange gestellt. Klicken Sie bei einer Nachricht in der Warteschlange auf **Steuern**, um diese Folgeanfrage in den laufenden Turn einzufügen.
    - Geben Sie `/stop` (oder eigenständige Abbruchformulierungen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) ein, um außerhalb des regulären Ablaufs abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe dieser Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Beibehaltung unvollständiger Ausgaben bei Abbruch">
    - Wenn ein Lauf abgebrochen wird, kann unvollständiger Assistententext weiterhin in der Benutzeroberfläche angezeigt werden.
    - Der Gateway speichert bei vorhandener gepufferter Ausgabe abgebrochenen unvollständigen Assistententext dauerhaft im Transkriptverlauf.
    - Gespeicherte Einträge enthalten Abbruchmetadaten, damit Transkriptverbraucher unvollständige Abbruchausgaben von regulär abgeschlossenen Ausgaben unterscheiden können.

  </Accordion>
</AccordionGroup>

## Verbindungsverlust und Wiederverbindung

Sobald eine Sitzung hergestellt wurde, führt eine unterbrochene Gateway-Verbindung nicht zu Ihrer Abmeldung. Das Dashboard
bleibt sichtbar und zeigt unter der oberen Leiste eine schwebende bernsteinfarbene Anzeige „Gateway-Verbindung unterbrochen — Verbindung wird wiederhergestellt…“, während der Client automatisch mit zunehmenden Wartezeiten (800 ms bis zu 15 s) neue Verbindungsversuche unternimmt. Live-Aktualisierungen und
Echtzeit-/Sitzungsaktionen werden pausiert, bis die Verbindung wiederhergestellt ist; **Jetzt erneut versuchen** in der Anzeige erzwingt einen
sofortigen Versuch. Der Chat bleibt bearbeitbar: Gewöhnlicher Text und Anhänge zum Senden werden im
auf Gateway und Sitzung begrenzten Browserspeicher des aktuellen Tabs aufbewahrt, als auf die Wiederverbindung wartend angezeigt und
automatisch gesendet, sobald der Gateway wieder verfügbar ist. Live-Bedienelemente und Slash-Befehle bleiben im
Offlinezustand nicht verfügbar.

Wenn dieser Browser bereits über Zugangsdaten verfügt (ein konfiguriertes Token/Passwort oder ein genehmigtes Geräte-
Token), zeigen das erstmalige Öffnen und erneute Laden während des Verbindungsaufbaus ein kleines animiertes OpenClaw-Symbol,
statt kurzzeitig die Anmeldesperre einzublenden. Die Anmeldesperre erscheint nur, wenn noch keine Zugangsdaten
gespeichert sind oder wenn der Gateway sie aktiv ablehnt (ungültiges Token/Passwort, widerrufene Kopplung) —
also in Zuständen, die Ihre Eingabe erfordern, statt weiteres Warten.

## PWA-Installation und Web Push

Die Control UI enthält eine `manifest.webmanifest` und einen Service Worker, sodass moderne Browser sie als eigenständige PWA installieren können. Mit Web Push kann der Gateway die installierte PWA durch Benachrichtigungen aktivieren, selbst wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einer OpenClaw-Aktualisierung **Protokollkonflikt** anzeigt, öffnen Sie das Dashboard zunächst mit `openclaw dashboard` erneut und führen Sie eine vollständige Aktualisierung durch. Falls der Fehler weiterhin auftritt, löschen Sie die Websitedaten für den Ursprung des Dashboards oder testen Sie in einem privaten Browserfenster; ein alter Tab oder Browser-Service-Worker-Cache kann weiterhin ein Control-UI-Bundle von vor der Aktualisierung mit dem neueren Gateway ausführen.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „Install app“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Klicks auf Benachrichtigungen verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-Zustandsverzeichnis) | Automatisch erzeugtes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzdaten. |
| `push/web-push-subscriptions.json`                    | Dauerhaft gespeicherte Browser-Abonnementendpunkte.                |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen des Gateway-Prozesses, wenn Sie Schlüssel fest vorgeben möchten (Bereitstellungen auf mehreren Hosts, Secret-Rotation oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standardwert: `https://openclaw.ai`)

Die Control UI verwendet die folgenden bereichsbeschränkten Gateway-Methoden, um Browser-Abonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` registriert einen `endpoint` zusammen mit `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` entfernt einen registrierten Endpunkt.
- `push.web.test` sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für Relay-gestützte Push-Benachrichtigungen) und von der Methode `push.test`, die auf die native Mobilgerätekopplung ausgerichtet ist.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte mit dem Shortcode `[embed ...]` direkt einbetten. Die iframe-Sandbox-Richtlinie wird durch `gateway.controlUi.embedSandbox` gesteuert:

Das mitgelieferte Canvas-Plugin stellt außerdem [`show_widget`](/de/tools/show-widget) bereit, um eigenständiges SVG oder HTML direkt aus einem Tool-Aufruf zu rendern. Der Browser meldet die Gateway-Fähigkeit `inline-widgets`, und das resultierende Canvas-Dokument bleibt verfügbar, wenn der Chatverlauf neu geladen wird. Über Kanäle ausgelöste Läufe erhalten dieses Tool nicht.

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung in gehosteten Einbettungen.
  </Tab>
  <Tab title="scripts (default)">
    Ermöglicht interaktive Einbettungen bei gleichzeitiger Ursprungsisolierung; in der Regel ausreichend für eigenständige Browserspiele/-Widgets.
  </Tab>
  <Tab title="trusted">
    Ergänzt `allow-same-origin` zusätzlich zu `allow-scripts` für Dokumente derselben Website, die absichtlich umfassendere Berechtigungen benötigen.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Verhalten mit demselben Ursprung benötigt. Für die meisten von Agenten generierten Spiele und interaktiven Canvas-Inhalte ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig blockiert. Damit `[embed url="https://..."]` Seiten von Drittanbietern laden kann, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chatnachrichten

Das Chattranskript verwendet einen zentrierten, gut lesbaren Rahmen, der am Composer ausgerichtet ist. Ausgaben des Assistenten und von Tools bleiben linksbündig, während Benutzerblasen innerhalb dieses Rahmens rechtsbündig bleiben. Bei Bereitstellungen auf breiten Monitoren kann die Transkriptbreite ohne Änderung des mitgelieferten CSS überschrieben werden, indem `gateway.controlUi.chatMessageMaxWidth` festgelegt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Formen umfassen einfache Längen und Prozentangaben wie `960px` oder `82%` sowie beschränkte Breitenausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Lassen Sie den Gateway auf Loopback und verwenden Sie Tailscale Serve als HTTPS-Proxy:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`).

    Standardmäßig können Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw überprüft die Identität, indem es die Adresse aus `x-forwarded-for` mit `tailscale whois` auflöst und mit dem Header abgleicht, und akzeptiert diese nur, wenn die Anfrage Loopback mit den `x-forwarded-*`-Headern von Tailscale erreicht. Für Control-UI-Operatorsitzungen mit Browsergeräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Umlauf zur Gerätekopplung; Browser ohne Gerät und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie selbst für Serve-Datenverkehr explizite Zugangsdaten mit gemeinsamem Secret verlangen möchten, und verwenden Sie anschließend `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungsbereich vor Schreibvorgängen für die Ratenbegrenzung serialisiert. Gleichzeitige fehlerhafte Wiederholungsversuche desselben Browsers können daher bei der zweiten Anfrage `retry later` statt zweier einfacher, parallel konkurrierender Nichtübereinstimmungen anzeigen.

    <Warning>
    Die tokenlose Serve-Authentifizierung setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, verlangen Sie eine Token-/Passwortauthentifizierung.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`).

    Fügen Sie das entsprechende gemeinsame Secret in die UI-Einstellungen ein (wird als `connect.params.auth.token` oder `connect.params.auth.password` gesendet).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über unverschlüsseltes HTTP (`http://<lan-ip>` oder `http://<tailscale-ip>`) öffnen, wird der Browser in einem **unsicheren Kontext** ausgeführt und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- nur für localhost geltende Kompatibilität mit unsicherem HTTP über `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Operator-Control-UI-Authentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die Benutzeroberfläche lokal unter `https://<magicdns>/` (Serve) beziehungsweise `http://127.0.0.1:18789/` (auf dem Gateway-Host).

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

    `allowInsecureAuth` ist ausschließlich ein lokaler Kompatibilitätsschalter:

    - Er ermöglicht Control-UI-Sitzungen auf localhost, in nicht sicheren HTTP-Kontexten ohne Geräteidentität fortzufahren.
    - Er umgeht keine Kopplungsprüfungen.
    - Er lockert nicht die Anforderungen an die Geräteidentität für entfernte Verbindungen (außerhalb von localhost).

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität für die Control UI und stellt eine gravierende Herabsetzung der Sicherheit dar. Machen Sie dies nach der Verwendung im Notfall schnellstmöglich rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu vertrauenswürdigen Proxys">
    - Eine erfolgreiche Authentifizierung über einen vertrauenswürdigen Proxy kann Control-UI-Sitzungen für **Operatoren** ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit Node-Rolle.
    - Loopback-Reverse-Proxys auf demselben Host erfüllen die Authentifizierung über einen vertrauenswürdigen Proxy weiterhin nicht; siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Anleitungen zur HTTPS-Einrichtung finden Sie unter [Tailscale](/de/gateway/tailscale).

## Richtlinie zur Inhaltssicherheit

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Erlaubt sind nur Ressourcen desselben Ursprungs (**same-origin**), `data:`-URLs und lokal erzeugte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen niemals Netzwerkanfragen aus.

In der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (beispielsweise `/avatars/<id>`), werden weiterhin dargestellt. Dies schließt authentifizierte Avatar-Routen ein, welche die UI abruft und in lokale `blob:`-URLs umwandelt.
- Eingebettete `data:image/...`-URLs werden weiterhin dargestellt.
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin dargestellt.
- Avatare für GitHub-Linkvorschauen werden vom Gateway vom festgelegten Avatar-Host von GitHub abgerufen und als größenbeschränkte `data:`-URLs zurückgegeben; der Browser des Operators kontaktiert den entfernten Avatar-Host niemals.
- Durch Kanalmetadaten ausgegebene entfernte Avatar-URLs werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo/Abzeichen ersetzt. Somit kann ein kompromittierter oder bösartiger Kanal keine beliebigen Abrufe entfernter Bilder durch den Browser eines Operators erzwingen.

Dies ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn die Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie die übrige API:

- `GET /avatar/<agentId>` gibt das Avatarbild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt unter derselben Bedingung die Avatar-Metadaten zurück.
- Nicht authentifizierte Anfragen an eine der beiden Routen werden abgelehnt (entsprechend der zugehörigen Route für Assistentenmedien), sodass die Avatar-Route auf ansonsten geschützten Hosts die Agentenidentität nicht preisgeben kann.
- Die Control UI übermittelt beim Abrufen von Avataren das Gateway-Token als Bearer-Header und verwendet authentifizierte Blob-URLs, damit das Bild weiterhin in Dashboards dargestellt wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird entsprechend dem übrigen Gateway auch die Avatar-Route nicht authentifiziert.

## Authentifizierung der Route für Assistentenmedien

Wenn die Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operatorauthentifizierung der Control UI; der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, dessen Gültigkeitsbereich auf exakt diesen Quellpfad beschränkt ist.
- Vom Browser dargestellte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Dadurch bleibt die Mediendarstellung mit browsernativen Medienelementen kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbaren Medien-URLs offenzulegen.

## Genehmigungslinks

Benachrichtigungen zu Operatorgenehmigungen können per Deep-Link auf ein eigenständiges Genehmigungsdokument verweisen, das unter dem reservierten Namensraum `${controlUiBasePath}/approve/{approvalId}` bereitgestellt wird (beispielsweise `/approve/<approvalId>` oder bei konfiguriertem Basispfad `/openclaw/approve/<approvalId>`). Die URL bleibt während der gesamten Gültigkeitsdauer der Genehmigung stabil und kann sicher zwischen Ihren eigenen Geräten weitergeleitet werden: Sie identifiziert die Genehmigung, autorisiert sie jedoch niemals.

- Der aus einem Segment bestehende Namensraum `/approve/<approvalId>` wird vom Gateway vor den HTTP-Routen von Plugins für **alle** HTTP-Methoden reserviert, sodass eine Plugin-Route ein Genehmigungsdokument niemals verdecken oder abfangen kann.
- Das Öffnen eines Genehmigungsdokuments erfordert dieselbe Gateway-Authentifizierung wie die übrige Control UI (Token/Passwort, Tailscale-Serve-Identität oder Identität eines vertrauenswürdigen Proxys); Anmeldedaten sind niemals Bestandteil der Genehmigungs-URL.
- Wenn die Bereitstellung der Control UI deaktiviert ist, geben Anfragen an den Namensraum `404` zurück, anstatt an Plugin-Handler weitergeleitet zu werden.
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

Wenn der Browser ein leeres Dashboard lädt und die Entwicklertools keinen hilfreichen Fehler anzeigen, hat möglicherweise eine Erweiterung oder ein früh ausgeführtes Inhaltsskript die Auswertung der JavaScript-Modulanwendung verhindert. Die statische Seite enthält einen einfachen HTML-Wiederherstellungsbereich, der angezeigt wird, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie nach einer Änderung der Browserumgebung die Aktion **Try again** im Bereich oder laden Sie die Seite nach den folgenden Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die Inhalte in alle Seiten einschleusen, insbesondere Erweiterungen mit `<all_urls>`-Inhaltsskripten.
- Versuchen Sie es mit einem privaten Fenster, einem sauberen Browserprofil oder einem anderen Browser.
- Lassen Sie das Gateway laufen und überprüfen Sie nach dem Browserwechsel dieselbe Dashboard-URL.

## Debugging/Tests: Entwicklungsserver und entferntes Gateway

Die Control UI besteht aus statischen Dateien; das WebSocket-Ziel ist konfigurierbar und kann sich vom HTTP-Ursprung unterscheiden. Dies ist praktisch, wenn Sie den Vite-Entwicklungsserver lokal verwenden möchten, das Gateway jedoch an einem anderen Ort ausgeführt wird.

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, URL-codieren Sie den Wert, damit der Browser die Abfragezeichenfolge korrekt verarbeitet.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch eine Offenlegung in Anfrageprotokollen und über den Referer vermieden wird. Veraltete `?token=`-Abfrageparameter werden aus Kompatibilitätsgründen weiterhin einmalig importiert, jedoch nur als Rückfalloption, und unmittelbar nach dem Startvorgang entfernt.
    - `password` wird ausschließlich im Arbeitsspeicher gehalten.
    - Wenn `gatewayUrl` festgelegt ist, greift die UI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) ausdrücklich an; fehlende ausdrücklich angegebene Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird ausschließlich in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Control-UI-Bereitstellungen außerhalb von Loopback müssen `gateway.controlUi.allowedOrigins` ausdrücklich festlegen (vollständige Ursprünge). Private LAN-/Tailnet-Ladevorgänge desselben Ursprungs von Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Rückfall auf den Host-Header zu aktivieren.
    - Beim Start des Gateways können lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` anhand der wirksamen Laufzeitbindung und des Ports vorbelegt werden; entfernte Browserursprünge benötigen jedoch weiterhin ausdrückliche Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` ausschließlich für streng kontrollierte lokale Tests; dies bedeutet, jeden Browserursprung zuzulassen, nicht „den jeweils von mir verwendeten Host abzugleichen“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Modus für den Rückfall auf den Host-Header-Ursprung, stellt jedoch einen gefährlichen Sicherheitsmodus dar.

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

Details zur Einrichtung des Fernzugriffs: [Fernzugriff](/de/gateway/remote).

## Verwandte Themen

- [Dashboard](/de/web/dashboard) — Gateway-Dashboard
- [Integritätsprüfungen](/de/gateway/health) — Überwachung des Gateway-Zustands
- [TUI](/de/web/tui) — Terminal-Benutzeroberfläche
- [WebChat](/de/web/webchat) — browserbasierte Chat-Oberfläche
