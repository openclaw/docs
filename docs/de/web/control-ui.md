---
read_when:
    - Sie möchten das Gateway über einen Browser bedienen
    - Sie möchten ohne SSH-Tunnel auf das Tailnet zugreifen
sidebarTitle: Control UI
summary: Browserbasierte Steuerungsoberfläche für das Gateway (Chat, Aktivität, Nodes, Konfiguration)
title: Steuerungsoberfläche
x-i18n:
    generated_at: "2026-07-12T16:07:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5e9902cd8c2b7af0f47eaeec73cf365dd0f3963900b28880d4150939a1f447a2
    source_path: web/control-ui.md
    workflow: 16
---

Die Control UI ist eine kleine, vom Gateway bereitgestellte **Vite + Lit**-Single-Page-App:

- Standard: `http://<host>:18789/`
- optionales Präfix: Legen Sie `gateway.controlUi.basePath` fest (z. B. `/openclaw`)

Sie kommuniziert **direkt mit dem Gateway-WebSocket** am selben Port.

## Schnell öffnen (lokal)

Wenn das Gateway auf demselben Computer ausgeführt wird, öffnen Sie [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oder [http://localhost:18789/](http://localhost:18789/)).

Wenn die Seite nicht geladen werden kann, starten Sie zuerst das Gateway: `openclaw gateway`.

<Note>
Bei nativen Windows-LAN-Bindungen können die Windows-Firewall oder von der Organisation verwaltete Gruppenrichtlinien die angegebene LAN-URL weiterhin blockieren, selbst wenn `127.0.0.1` auf dem Gateway-Host funktioniert. Führen Sie `openclaw gateway status --deep` auf dem Windows-Host aus; der Befehl meldet wahrscheinlich blockierte Ports, nicht übereinstimmende Profile und lokale Firewallregeln, die möglicherweise von Richtlinien ignoriert werden.
</Note>

Die Authentifizierung wird während des WebSocket-Handshakes über Folgendes bereitgestellt:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale-Serve-Identitätsheader, wenn `gateway.auth.allowTailscale: true`
- Identitätsheader eines vertrauenswürdigen Proxys, wenn `gateway.auth.mode: "trusted-proxy"`

Im Einstellungsbereich des Dashboards wird ein Token für die aktuelle Sitzung des Browser-Tabs und die ausgewählte Gateway-URL gespeichert; Passwörter werden nicht dauerhaft gespeichert. Das Onboarding erzeugt bei der ersten Verbindung normalerweise ein Gateway-Token für die Authentifizierung mit einem gemeinsamen Geheimnis, aber die Passwortauthentifizierung funktioniert ebenfalls, wenn `gateway.auth.mode` auf `"password"` gesetzt ist.

## Gerätekopplung (erste Verbindung)

Die Verbindung über einen neuen Browser oder ein neues Gerät erfordert normalerweise eine **einmalige Genehmigung der Kopplung**, die als `disconnected (1008): pairing required` angezeigt wird.

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

Wenn der Browser die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Berechtigungsbereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt; führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Der Wechsel eines bereits gekoppelten Browsers vom Lesezugriff zum Schreib-/Administratorzugriff wird als Erweiterung der Genehmigung und nicht als stillschweigende Wiederverbindung behandelt: OpenClaw lässt die alte Genehmigung aktiv, blockiert die Wiederverbindung mit den umfassenderen Berechtigungen und fordert Sie auf, den neuen Satz von Berechtigungsbereichen ausdrücklich zu genehmigen.

Nach der Genehmigung wird das Gerät gespeichert und erfordert keine erneute Genehmigung, sofern Sie diese nicht mit `openclaw devices revoke --device <id> --role <role>` widerrufen. Informationen zur Token-Rotation, zum Widerruf und zum Ablauf der erstmaligen Genehmigung für Paperclip / `openclaw_gateway` finden Sie unter [Geräte-CLI](/de/cli/devices).

<Note>
- Direkte lokale Browser-Verbindungen über die Loopback-Schnittstelle (`127.0.0.1` / `localhost`) werden automatisch genehmigt.
- Tailscale Serve kann für Control-UI-Bediensitzungen den Kopplungsvorgang überspringen, wenn `gateway.auth.allowTailscale: true` gilt, die Tailscale-Identität verifiziert wurde und der Browser seine Geräteidentität vorlegt. Browser ohne Geräteidentität und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Geräteprüfungen.
- Direkte Tailnet-Bindungen, Browser-Verbindungen über das LAN und Browserprofile ohne Geräteidentität erfordern weiterhin eine ausdrückliche Genehmigung.
- Jedes Browserprofil erzeugt eine eindeutige Geräte-ID. Daher ist nach einem Browserwechsel oder dem Löschen der Browserdaten eine erneute Kopplung erforderlich.

</Note>

## Mobilgerät koppeln

Ein bereits gekoppelter Administrator kann den QR-Code für die iOS-/Android-Verbindung erstellen, ohne ein Terminal zu öffnen:

<Steps>
  <Step title="Mobile Kopplung öffnen">
    Wählen Sie **Geräte** aus und klicken Sie anschließend auf der Karte **Geräte** auf **Mobilgerät koppeln**.
  </Step>
  <Step title="Telefon verbinden">
    Öffnen Sie in der mobilen OpenClaw-App **Einstellungen** → **Gateway** und scannen Sie den QR-Code. Alternativ können Sie den Einrichtungscode kopieren und einfügen.
  </Step>
  <Step title="Verbindung bestätigen">
    Die offizielle iOS-/Android-App stellt automatisch eine Verbindung her. Wenn unter **Ausstehende Genehmigung** eine Anfrage angezeigt wird, prüfen Sie deren Rolle und Berechtigungsbereiche, bevor Sie sie genehmigen.
  </Step>
</Steps>

Zum Erstellen eines Einrichtungscodes ist `operator.admin` erforderlich; für Sitzungen ohne diese Berechtigung ist die Schaltfläche deaktiviert. Ein Einrichtungscode enthält kurzzeitig gültige Bootstrap-Anmeldedaten. Behandeln Sie daher den QR-Code und den kopierten Code wie ein Passwort, solange sie gültig sind. Für die Remote-Kopplung muss das Gateway zu `wss://` aufgelöst werden (beispielsweise über Tailscale Serve/Funnel); einfaches `ws://` ist auf Loopback- und private LAN-Adressen beschränkt. Vollständige Informationen zur Sicherheit und zu Ausweichverfahren finden Sie unter [Kopplung](/de/channels/pairing#pair-from-the-control-ui-recommended).

## Persönliche Identität (browserlokal)

Die Control UI unterstützt eine browserbezogene persönliche Identität (Anzeigename und Avatar), die ausgehenden Nachrichten zur Zuordnung in gemeinsam genutzten Sitzungen hinzugefügt wird. Sie befindet sich im Browserspeicher, ist auf das aktuelle Browserprofil beschränkt und wird weder mit anderen Geräten synchronisiert noch serverseitig über die üblichen Metadaten zur Autorenschaft der von Ihnen gesendeten Nachrichten hinaus gespeichert. Durch das Löschen der Website-Daten oder einen Browserwechsel wird sie geleert.

Die Überschreibung des Assistenten-Avatars folgt demselben browserlokalen Muster: Hochgeladene Überschreibungen werden lokal über die vom Gateway aufgelöste Identität gelegt und niemals über `config.patch` übertragen. Das gemeinsam genutzte Konfigurationsfeld `ui.assistant.avatar` steht weiterhin für Clients außerhalb der UI zur Verfügung, die das Feld direkt schreiben.

## Endpunkt für die Laufzeitkonfiguration

Die Control UI ruft ihre Laufzeiteinstellungen von `/control-ui-config.json` ab, relativ zum Basispfad der Control UI des Gateways aufgelöst (beispielsweise `/__openclaw__/control-ui-config.json` unter dem Basispfad `/__openclaw__/`). Dieser Endpunkt wird durch dieselbe Gateway-Authentifizierung geschützt wie die übrige HTTP-Oberfläche: Nicht authentifizierte Browser können ihn nicht abrufen, und ein erfolgreicher Abruf erfordert ein gültiges Gateway-Token/-Passwort, eine Tailscale-Serve-Identität oder die Identität eines vertrauenswürdigen Proxys.

## Status des Gateway-Hosts

Öffnen Sie in der einfachen Ansicht **Einstellungen**, um die Karte **Gateway-Host** mit dem Gateway-Computer, der LAN-Adresse, dem Betriebssystem, der Laufzeit, der Betriebszeit, der CPU-Auslastung, dem Arbeitsspeicher und dem Speicherplatz des Zustands-Volumes anzuzeigen. Während die Karte sichtbar ist, wird sie alle 10 Sekunden über den Gateway-RPC `system.info` aktualisiert, der den Berechtigungsbereich `operator.read` erfordert. Bei älteren Gateways und Verbindungen ohne diesen Berechtigungsbereich wird die Karte nicht angezeigt.

## Sprachunterstützung

Die Control UI wird beim ersten Laden anhand der Browsersprache lokalisiert. Um sie später zu ändern, öffnen Sie **Einstellungen -> Allgemein -> Sprache** (die Auswahl befindet sich auf der Karte mit den allgemeinen Schnelleinstellungen, nicht unter „Darstellung“).

- Unterstützte Gebietsschemas: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Nicht englische Übersetzungen werden im Browser bei Bedarf geladen.
- Das ausgewählte Gebietsschema wird im Browserspeicher gespeichert und bei zukünftigen Besuchen wiederverwendet.
- Fehlende Übersetzungsschlüssel greifen auf Englisch zurück.

Dokumentationsübersetzungen werden für denselben Satz nicht englischer Gebietsschemas erzeugt, aber die integrierte Mintlify-Sprachauswahl der Dokumentationswebsite führt nur Gebietsschemacodes auf, die Mintlify akzeptiert. Die thailändische (`th`) und persische (`fa`) Dokumentation wird weiterhin im Veröffentlichungs-Repository erzeugt; sie wird möglicherweise erst in dieser Auswahl angezeigt, wenn Mintlify diese Codes unterstützt.

## Darstellungsthemen

Der Bereich „Darstellung“ enthält die integrierten Themen Claw, Knot und Dash (Claw ist die Standardeinstellung) sowie einen browserlokalen Importplatz für tweakcn. Um ein Thema zu importieren, öffnen Sie den [tweakcn-Editor](https://tweakcn.com/editor/theme), wählen oder erstellen Sie ein Thema, klicken Sie auf **Share** und fügen Sie den kopierten Link unter „Darstellung“ ein. Der Import akzeptiert außerdem Registrierungs-URLs im Format `https://tweakcn.com/r/themes/<id>`, Editor-URLs wie `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relative Pfade im Format `/themes/<id>`, rohe Themen-IDs und Namen von Standardthemen wie `amethyst-haze`.

Importierte Themen werden nur im aktuellen Browserprofil gespeichert; sie werden nicht in die Gateway-Konfiguration geschrieben und nicht geräteübergreifend synchronisiert. Beim Ersetzen des importierten Themas wird der eine lokale Platz aktualisiert; beim Löschen wird wieder zu Claw gewechselt, wenn das importierte Thema aktiv war.

Unter „Darstellung“ gibt es außerdem eine browserlokale Einstellung für die Textgröße, die zusammen mit den übrigen Einstellungen der Control UI gespeichert wird. Sie gilt für Chattext, Editor-Text, Werkzeugkarten und Chat-Seitenleisten und hält Texteingaben auf mindestens 16px, damit mobiles Safari beim Fokussieren nicht automatisch zoomt.

## Plugins verwalten

Öffnen Sie in der Seitenleiste **Plugins** oder verwenden Sie `/settings/plugins` relativ zum
konfigurierten Basispfad der Control UI, um Plugins zu durchsuchen und zu verwalten, ohne
die Control UI zu verlassen. Beispielsweise verwendet ein Basispfad von `/openclaw`
den Pfad `/openclaw/settings/plugins`. Die Seite ist immer verfügbar, selbst wenn alle
optionalen Plugins deaktiviert sind.

Plugins ist eine Zentrale mit vier Registerkarten: Unter **Installiert** und **Entdecken** wird Plugin-
Code unter `/settings/plugins` verwaltet, **Skills** enthält die agentenspezifische Skill-Verwaltung unter
`/skills`, und **Workshop** enthält die Prüfung von Skill-Workshop-Vorschlägen unter
`/skills/workshop`. Jede Registerkarte behält ihre eigene URL bei, und in der Seitenleiste wird für
alle gemeinsam nur der Eintrag „Plugins“ angezeigt.

Die Registerkarte **Installiert** zeigt den vollständigen lokalen Bestand nach Kategorien gruppiert und mit
Übersichtszahlen an. Jede Zeile öffnet eine Detailansicht; über das Überlaufmenü (`…`) kann
das Plugin aktiviert oder deaktiviert werden, und für extern installierte Plugins ist außerdem **Entfernen** verfügbar.
Dort werden auch konfigurierte [MCP-Server](/de/cli/mcp) aufgelistet, die direkt hinzugefügt, deaktiviert
und entfernt werden können. Die Registerkarte **Entdecken** ist der Store: vorgestellte, in OpenClaw
enthaltene Plugins, offizielle externe Plugins und MCP-Konnektoren für beliebte Dienste, die mit einem Klick
eingerichtet werden können. Bei Eingaben in das Suchfeld wird
[ClawHub](https://clawhub.ai/plugins) direkt abgefragt und ein Abschnitt **Von ClawHub**
mit Downloadzahlen und Kennzeichnungen zur Quellenverifizierung angefügt. Deep Links können
den Store direkt über `/settings/plugins?tab=discover` aufrufen.

Die Registerkarte **Skills** enthält den Skill-Statusbericht, Umschalter zum Aktivieren und Deaktivieren, die Eingabe von API-
Schlüsseln und die direkte ClawHub-Skill-Suche, jeweils bezogen auf den ausgewählten Agenten. Die
Registerkarte **Workshop** enthält das Skill-Workshop-Board und den heutigen Prüfablauf für
[Skill-Vorschläge](/de/tools/skill-workshop).

Enthaltene Plugins sind bereits auf dem Gateway vorhanden und zeigen **Aktivieren** oder
**Deaktivieren** statt **Installieren** an. Workboard ist beispielsweise in
OpenClaw enthalten, aber standardmäßig deaktiviert, weshalb als Aktion **Aktivieren** angezeigt wird. Mitgelieferte Plugins
können nicht entfernt, sondern nur deaktiviert werden.

Zum Lesen des Katalogs und Durchsuchen von ClawHub ist `operator.read` erforderlich. Das Installieren,
Aktivieren, Deaktivieren oder Entfernen eines Plugins sowie das Ändern von MCP-Servern erfordert
`operator.admin`; für Operatoren mit reinem Lesezugriff bleiben diese Aktionen deaktiviert.

ClawHub-Installationen werden über das Gateway ausgeführt und unterliegen denselben Vertrauens-, Integritäts-
und Plugin-Installationsrichtlinienprüfungen wie andere durch das Gateway vermittelte Installationen. Nach der Installation
oder Entfernung von Plugin-Code ist ein Neustart des Gateways erforderlich. Das Aktivieren oder Deaktivieren eines
installierten Plugins kann ohne Neustart wirksam werden, wenn das Plugin und die aktuelle
Gateway-Laufzeit dies unterstützen; andernfalls meldet die UI, dass ein Neustart
erforderlich ist. OAuth-gestützte MCP-Konnektoren benötigen nach dem Hinzufügen eine einmalige
Anmeldung über `openclaw mcp login <name>` in der CLI.

Die Seite konzentriert sich bewusst auf Bestand, Suche, Installation, Aktivierung
und Entfernung. Verwenden Sie [`openclaw plugins`](/de/cli/plugins) für beliebige npm-, git- oder
lokale Pfadquellen, Aktualisierungen und erweiterte Plugin-Konfigurationen.

## Navigation in der Seitenleiste

Die Seitenleiste fixiert die Navigation oberhalb einer scrollbaren Sitzungsliste. In Multi-Agent-Konfigurationen wird jeder Agent als einklappbarer Abschnitt der obersten Ebene angezeigt; wenn Sie einen Agent erweitern, können Sie seine Sitzungen durchsuchen, ohne den geöffneten Chat zu verlassen, und eingeklappte Agenten zeigen einen Ungelesen-Indikator. Innerhalb eines Agenten ist die Liste unterteilt in **Angeheftet**, je einen integrierten Abschnitt pro verbundenem Kanal (Telegram, Slack, WhatsApp, ...), einen integrierten Abschnitt **Arbeit** für Sitzungen, die an einen verwalteten Worktree oder eine Exec-Node gebunden sind (Zeilen zeigen eine Zeile `repo ⎇ branch` sowie den Node-Host), benutzerdefinierte Gruppen (die `category` der Sitzung) und **Chats** für den Rest. Kanal- und Arbeitsabschnitte klassifizieren Zeilen automatisch; die Zuweisung einer Sitzung zu einer benutzerdefinierten Gruppe hat stets Vorrang. Beim Öffnen einer Sitzung wird die Auswahlmarkierung verschoben, ohne die Zeilen neu anzuordnen. Sitzungen mit neuen Aktivitäten seit dem letzten Lesen zeigen einen Ungelesen-Punkt; beim Öffnen werden sie als gelesen markiert. Jede Sitzungszeile verfügt über ein Kontextmenü (Dreipunkt-Schaltfläche oder Rechtsklick) mit Anheften/Lösen, Als ungelesen/gelesen markieren, Umbenennen, Abspalten, In Gruppe verschieben (einschließlich Neue Gruppe und Aus Gruppe entfernen), Archivieren und Löschen; in Touch-Layouts bleiben die direkten Steuerelemente zum Anheften und für das Menü sichtbar. Mit Cmd-/Strg-Klick schalten Sie Zeilen in eine Mehrfachauswahl, und mit Umschalt-Klick erweitern Sie diese über die sichtbare Reihenfolge; wenn Sie anschließend das Menü einer ausgewählten Zeile öffnen, werden Stapelaktionen angeboten (N als ungelesen/gelesen markieren, N in Gruppe verschieben, N archivieren, N löschen), die auf jede ausgewählte Sitzung angewendet werden, wobei für das Löschen als Stapel nur eine Bestätigung erforderlich ist. Ziehen Sie eine Sitzung auf eine benutzerdefinierte Gruppe oder **Chats**, um sie zu verschieben. Überschriften benutzerdefinierter Gruppen können eingeklappt, erweitert oder durch Ziehen neu angeordnet werden; Gruppennamen und ihre Reihenfolge werden im Gateway (`sessions.groups.*`) gespeichert und stehen Ihnen daher browserübergreifend zur Verfügung, während der eingeklappte Zustand im Browserprofil verbleibt. Gruppenüberschriften verfügen außerdem über ein Menü (Dreipunkt-Schaltfläche oder Rechtsklick) mit Gruppe umbenennen, Neue Gruppe und Gruppe löschen; beim Umbenennen oder Löschen einer Gruppe werden alle zugehörigen Sitzungen serverseitig aktualisiert, einschließlich archivierter Sitzungen, und beim Löschen einer Gruppe bleiben ihre Sitzungen erhalten und werden zurück nach Chats verschoben. Das einzelne **+** in der Kopfzeile der Sitzungsliste öffnet die Seite „Neue Sitzung“ (siehe unten). Das Steuerelement zum Sortieren verfügt außerdem über den Umschalter Gruppieren nach: Gruppiert (Standard) oder Keine für eine einzige flache Liste (**Angeheftet** bleibt separat); die Auswahl wird im aktuellen Browserprofil gespeichert. **Nutzung**, **Automatisierungen** und **Plugins** sind standardmäßig angeheftet; erweitern Sie **Mehr**, um alle anderen Ziele zu erreichen. Wählen Sie unter Mehr **Angeheftete Elemente bearbeiten** aus oder klicken Sie mit der rechten Maustaste auf den Navigationsbereich, um Ziele anzuheften oder zu lösen und die Standardeinstellungen wiederherzustellen. Die angeheftete Auswahl und der Erweiterungszustand von Mehr werden im aktuellen Browserprofil gespeichert und bleiben nach dem Neuladen erhalten.

## Seite „Neue Sitzung“

Das **+** in der Kopfzeile der Sitzungsliste in der Seitenleiste öffnet unter `/new` einen ganzseitigen Entwurf: Es wird nichts erstellt, bis Sie die erste Nachricht senden. Eine Zielzeile oberhalb des Nachrichtenfelds legt fest, wo die Sitzung arbeitet: den Agenten (bei Multi-Agent-Konfigurationen), wo Exec ausgeführt wird (**Gateway · lokal** oder eine gekoppelte Node, die `system.run` bereitstellt; erfordert `operator.admin`), den Ordner (standardmäßig der Arbeitsbereich des Agenten; andere absolute Gateway-Pfade erfordern `operator.admin` und einen Worktree) sowie einen optionalen Umschalter **Worktree** mit einer Auswahl des Basis-Branches (gestützt auf `worktrees.branches`, daher erfolgt kein Abruf) und einem optionalen Worktree-Namen (der Branch wird zu `openclaw/<name>`). Die Schaltfläche zum Durchsuchen im Ordner-Chip öffnet eine eingebettete Verzeichnisauswahl, die auf der nur für Administratoren verfügbaren Methode `fs.listDir` basiert. Auf der obersten Ebene werden das Gateway und jede bekannte Node angezeigt; Offline-Nodes und Nodes ohne Unterstützung zum Durchsuchen von Verzeichnissen bleiben sichtbar, sind jedoch deaktiviert. Wenn Sie das Gateway auswählen, wird beim aktuellen Ordner oder im Gateway-Benutzerverzeichnis begonnen. Wenn Sie eine geeignete Node auswählen, durchsuchen Sie das Host-Dateisystem dieser Node, binden Exec an sie und verwenden den ausgewählten absoluten Node-Pfad direkt (verwaltete Worktrees bleiben ausschließlich dem Gateway vorbehalten). Beim Absenden wird `sessions.create` mit der ersten Nachricht aufgerufen, sodass die Ausführung im selben Roundtrip beginnt und die Benutzeroberfläche zum Chat der neuen Sitzung wechselt. Wenn das Gateway die Sitzung erstellt, aber dieses erste Senden ablehnt, bleiben die Eingabeaufforderung und der Fehler im Chat auch nach dem Neuladen erhalten; **Erneut versuchen** sendet die Nachricht über die bereits erstellte Sitzung, anstatt eine weitere zu erstellen.

Innerhalb von **Einstellungen** beginnt die separate Seitenleiste mit einem Feld **Einstellungen durchsuchen**, über das Sie Einstellungsabschnitte schnell finden können.

  Ein **Suchfeld** oben in der Seitenleiste öffnet die Befehlspalette (⌘K). Durch Klicken auf die OpenClaw-Marke in der Kopfzeile der Seitenleiste wird der übersichtliche Startbildschirm für eine neue Sitzung geöffnet. Wenn etwas eine Aktion erfordert – fehlgeschlagene oder überfällige Cron-Aufträge, bald ablaufende oder abgelaufene Modellauthentifizierung –, erscheinen kompakte Hinweis-Chips über der Fußzeile der Seitenleiste, die beim Anklicken zur zuständigen Seite führen. Die kompakte Fußzeile fasst den Verbindungsstatus, **Einstellungen**, **Dokumentation**, die Mobilgeräte-Kopplung und den Umschalter für den hellen/dunklen/System-Farbmodus zusammen. Wenn der Gateway aus einem Quellcode-Checkout auf einem anderen Branch als `main` ausgeführt wird, zeigt die Fußzeile außerdem den Namen dieses Branches in Rot an, sodass ein Nicht-Release-Gateway auf einen Blick erkennbar ist (bei Release-Installationen wird er nie angezeigt). Umschalt-Befehl-Komma öffnet **Einstellungen**, ohne das Tastenkürzel Befehl-Komma des Browsers zu überschreiben. Die Kopfzeile der Seitenleiste enthält außerdem den Umschalter zum Einklappen (⌘B). Beim Einklappen wird die Seitenleiste vollständig ausgeblendet, sodass ein Arbeitsbereich über die gesamte Breite entsteht; ein schwebendes Steuerelement zum Ausklappen (oder ⌘B) blendet sie wieder ein. In der macOS-App befindet sich dieser Umschalter stattdessen nativ in der Titelleiste. Die Seitenleiste ist auf dem Desktop das einzige Navigationselement; es gibt keine obere Leiste. Bei schmalen Ansichten wird die Seitenleiste durch einen seitlich eingeblendeten Drawer hinter einer kompakten Kopfzeile ersetzt, die den Drawer-Umschalter, die Marke und die Suche der Befehlspalette enthält. In der macOS-App integriert diese Kopfzeile den Freiraum der Titelleiste in einen einzigen kompakten Streifen neben den Fenstersteuerelementen. Die Navigation verwendet den regulären Browserverlauf, sodass sie mit den Zurück-/Vorwärts-Schaltflächen des Browsers durchlaufen werden kann. Die macOS-App ergänzt neben den Fenstersteuerelementen einen nativen Seitenleisten-Umschalter sowie Trackpad-Wischgesten. Bei ausgeklappter Seitenleiste befinden sich Zurück-/Vorwärts-Schaltflächen an deren rechtem Rand; bei eingeklappter Seitenleiste werden native Schaltflächen für die Suche (Befehlspalette) und eine neue Sitzung angezeigt.

  ## Was es kann (heute)

  <AccordionGroup>
  <Accordion title="Chat und Sprache">
    - Chatten Sie über Gateway WS mit dem Modell (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Bei der Aktualisierung des Chatverlaufs wird ein begrenztes aktuelles Zeitfenster mit Textobergrenzen pro Nachricht angefordert, damit große Sitzungen den Browser nicht zwingen, die Nutzdaten eines vollständigen Transkripts zu rendern, bevor der Chat verwendet werden kann.
    - Wenn Sie den Mauszeiger über einen öffentlichen GitHub-Issue- oder Pull-Request-Link bewegen oder ihn per Tastatur fokussieren, werden dessen Status, Titel, Autor, letzte Aktivität, Kommentare und Änderungsstatistiken angezeigt. Der verbundene Gateway ruft öffentliche Metadaten ab und speichert sie zwischen, ohne das Linkziel zu ändern – auch wenn die Benutzeroberfläche einen Remote-Gateway verwendet. Der Gateway verwendet `GH_TOKEN` oder `GITHUB_TOKEN`, sofern verfügbar, nachdem bestätigt wurde, dass das Repository öffentlich ist; andernfalls nutzt er die anonyme GitHub-API mit einem längerfristigen Cache.
    - Sprechen Sie über Echtzeitsitzungen im Browser. OpenAI verwendet direktes WebRTC, Google Live nutzt ein eingeschränktes Browser-Token zur einmaligen Verwendung über WebSocket und ausschließlich backendseitige Echtzeit-Sprach-Plugins verwenden den Gateway-Relay-Transport. Vom Client verwaltete Provider-Sitzungen beginnen mit `talk.client.create`; Gateway-Relay-Sitzungen beginnen mit `talk.session.create`. Das Relay hält die Provider-Anmeldedaten auf dem Gateway, während der Browser Mikrofon-PCM über `talk.session.appendAudio` streamt, leitet Provider-Tool-Aufrufe von `openclaw_agent_consult` über `talk.client.toolCall` an die Gateway-Richtlinie und das größere konfigurierte OpenClaw-Modell weiter und überträgt die Sprachsteuerung aktiver Ausführungen über `talk.client.steer` oder `talk.session.steer`.
    - Streamen Sie Tool-Aufrufe und Live-Karten mit Tool-Ausgaben im Chat (Agent-Ereignisse). Tool-Aktivitäten werden als typspezifische Zeilen dargestellt: Shell-Befehle zeigen den syntaxhervorgehobenen Befehl mit einer Ausgabe im Terminalstil; unterstützte Bearbeitungs- und Schreibaufrufe zeigen begrenzte Inline-Diffs, sofern verfügbar Zeilennummern und Statistiken im Format `+added -removed`; aufeinanderfolgende Aufrufe werden zu einer Zusammenfassung wie „13 Befehle ausgeführt, 6 Dateien gelesen, 9 Dateien bearbeitet“ zusammengefasst. Während eine Ausführung aktiv ist, bestimmt der neueste laufende Aufruf die Überschrift der Gruppe. Klappen Sie eine Zeile auf, um die verbleibenden Argumente und die Rohausgabe zu prüfen.
    - Optionale KI-generierte Zweckbezeichnungen für komplexe Tool-Aufrufe (lange Shell-Befehle, Plugin-Tools mit vielen Argumenten), aktiviert mit `gateway.controlUi.toolTitles: true` (standardmäßig deaktiviert). Die Bezeichnungen stammen von der gebündelten Methode `chat.toolTitles` über das standardmäßige Utility-Modell-Routing – entweder ein explizites `utilityModel` (vom Betreiber gewählter Provider, wie bei anderen Utility-Aufgaben) oder andernfalls das deklarierte Standard-Kleinmodell des Sitzungs-Providers – und werden Gateway-seitig pro Agent zwischengespeichert. Wenn die Opt-in-Option deaktiviert ist oder kein kostengünstiges Modell verwendet werden kann, behalten die Zeilen ihre deterministischen Bezeichnungen und es erfolgt kein Modellaufruf.
    - Starten oder verwerfen Sie kurzlebige, vom Modell vorgeschlagene Folgeaufgaben; angenommene Vorschläge öffnen eine neue Sitzung in einem verwalteten Worktree mit dem vorgeschlagenen Prompt.
    - Aktivitäts-Tab mit browserlokalen Zusammenfassungen nach dem Prinzip „Schwärzung zuerst“ für Live-Tool-Aktivitäten aus der bestehenden Übermittlung von `session.tool`-/Tool-Ereignissen.

  </Accordion>
  <Accordion title="Kanäle, Sitzungen, Speicher">
    - Kanäle: Status integrierter sowie gebündelter/externer Plugin-Kanäle, QR-Anmeldung und kanalspezifische Konfiguration (`channels.status`, `web.login.*`, `config.patch`).
    - Bei der Aktualisierung von Kanalprüfungen bleibt der vorherige Snapshot sichtbar, während langsame Provider-Prüfungen abgeschlossen werden; partielle Snapshots werden gekennzeichnet, wenn eine Prüfung oder ein Audit sein Zeitbudget für die Benutzeroberfläche überschreitet.
    - Sitzungen: Listen Sie standardmäßig die Sitzungen konfigurierter Agents auf, heften Sie häufig verwendete Sitzungen an, benennen Sie sie um, archivieren Sie inaktive Sitzungen oder stellen Sie sie wieder her, verwenden Sie bei veralteten Sitzungsschlüsseln nicht konfigurierter Agents einen Fallback und wenden Sie sitzungsspezifische Überschreibungen für Modell/Denken/Schnell/Ausführlich/Trace/Reasoning an (`sessions.list`, `sessions.patch`). Angeheftete Sitzungen werden über den zuletzt verwendeten, nicht angehefteten Sitzungen einsortiert; archivierte Sitzungen befinden sich in der Archivansicht der Seite „Sitzungen“ und behalten ihre Transkripte. Zeilen zeigen einen Punkt für ungelesene Sitzungen an, in denen seit dem letzten Lesen Aktivitäten stattgefunden haben, sowie Aktionen zum Markieren als ungelesen/gelesen (`sessions.patch { unread }`) und eine Fork-Aktion, die das Transkript in eine neue Sitzung abzweigt (`sessions.create { parentSessionKey, fork: true }`). Übersichtskacheln über der Tabelle fassen die geladene Übersicht zusammen (Anzahl der Sitzungen, aktive Ausführungen, ungelesene Sitzungen, Gesamtzahl der Token). Jede Zeile enthält ein Typsymbol mit einem Punkt für eine aktive Ausführung, der Status wird als einfacher Punkt mit Bezeichnung dargestellt und die Spalte „Token“ zeigt eine Nutzungsanzeige für das Kontextfenster, wenn die Sitzung Token- und Kontextgrößen meldet. Aktionen zur Zeilenverwaltung befinden sich in einem zeilenspezifischen Menü (Dreipunkt-Schaltfläche oder Rechtsklick), das dem Sitzungsmenü der Seitenleiste entspricht; der Zeilen-Drawer zeigt neben den anderen Sitzungsdetails auch die Agent-Laufzeit und die Ausführungsdauer an.
    - Sitzungsgruppierung: Ein Steuerelement „Gruppieren nach“ unterteilt die Sitzungstabelle nach benutzerdefinierten Gruppen, Kanal, Typ, Agent oder Datum in Abschnitte. Benutzerdefinierte Gruppen bleiben über `sessions.patch` (`category`) sitzungsspezifisch erhalten, sodass auch Sitzungen kategorisiert werden können, die über Nachrichtenkanäle (Discord, Telegram, WhatsApp, ...) gestartet wurden. Weisen Sie Gruppen zu, indem Sie Zeilen auf einen Abschnitt ziehen oder die zeilenspezifische Gruppenauswahl verwenden, und erstellen Sie Gruppen mit der Aktion „Neue Gruppe“.
    - Speicher (ein auf den ausgewählten Agent beschränkter Tab auf der Seite „Agents“): Dreaming-Status, Umschalter zum Aktivieren/Deaktivieren und Dream-Diary-Reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Aufgaben, Plugins, Skills, Geräte, Ausführungsgenehmigungen">
    - Automatisierungen (Cron-Jobs): Übersichtskarten (Anzahl der Automatisierungen, Anzahl der fehlgeschlagenen Automatisierungen, Scheduler-Status, nächster Aktivierungszeitpunkt) über einer Umschaltung zwischen den Tabs „Automatisierungen“ und „Ausführungsverlauf“; der Tab „Automatisierungen“ listet Jobs in einer filterbaren Tabelle auf (Alle/Aktiv/Pausiert, Suche, Zeitplan- und Letzte-Ausführung-Filter, Aktionsmenü pro Zeile) und zeigt darunter Vorschläge für den Einstieg, während der Tab „Ausführungsverlauf“ die letzten Ausführungen aller Automatisierungen anzeigt (`cron.*`).
    - Aufgaben: Live-Verzeichnis aktiver und kürzlich ausgeführter Hintergrundaufgaben mit verknüpften Sitzungen und Abbruchmöglichkeit (`tasks.*`).
    - Plugins: den installierten Bestand und den kuratierten Store durchsuchen, ClawHub durchsuchen, Plugin-Code installieren und entfernen sowie installierte Plugins aktivieren oder deaktivieren (`plugins.*`); Zeilen für MCP-Server bearbeiten `mcp.servers` über die Konfigurationsmethoden.
    - Skills: Status, Aktivieren/Deaktivieren, Installation, Aktualisierung von API-Schlüsseln (`skills.*`).
    - Geräte: Ein gemeinsamer Bestand führt Datensätze gekoppelter Geräte, den Node-Katalog und die Live-Präsenz zusammen (`device.pair.list`, `node.list`, `system-presence`). Der Gateway-Host ist an erster Stelle angeheftet; gekoppelte Clients zeigen Verbindungsstatus, Rollen, Token, Fähigkeiten und Befehle an. Doppelte Kopplungen werden zu einer erweiterbaren Gruppe zusammengefasst, und **N veraltete Einträge bereinigen** entfernt nach Administratorbestätigung gesammelt Offline-Duplikate, die automatisch genehmigt wurden (stiller lokaler Zugriff, vertrauenswürdiger CIDR-Bereich oder SSH-Verifizierung) oder aus der Zeit vor der Erfassung der Genehmigungsherkunft stammen. Einträge können entfernt werden (`node.pair.remove`, `device.pair.remove`), Gerätekopplungen und erneute Node-Genehmigungen werden direkt verarbeitet (`device.pair.*`, `node.pair.approve`/`reject`), und mobile Einrichtungscodes können über dieselbe Karte erstellt werden.
    - Ausführungsgenehmigungen: Gateway- oder Node-Zulassungslisten und die Abfragerichtlinie für `exec host=gateway/node` bearbeiten (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguration">
    - `~/.openclaw/openclaw.json` anzeigen/bearbeiten (`config.get`, `config.set`).
    - Profil: eine Einstellungsseite, die die Identität des Standard-Agenten mit Nutzungsstatistiken über die gesamte Laufzeit zeigt – Token über die gesamte Laufzeit, Tag mit der höchsten Nutzung, längste Sitzung, Aktivitätsserien, eine Token-Heatmap über ein Jahr, meistgenutzte Tools und Channel-Highlights (`usage.cost`, `sessions.usage`).
    - MCP verfügt über eine eigene Einstellungsseite mit schreibgeschützten Serverzeilen (Transport, Aktivierungsstatus, Zusammenfassungen zu OAuth/Filtern/Parallelität), gängigen Operatorbefehlen und dem auf `mcp` beschränkten Konfigurationseditor; Server werden auf der Seite „Plugins“ hinzugefügt, aktiviert/deaktiviert und entfernt.
    - Modell-Provider: eine Einstellungsseite, die jeden konfigurierten Modell-Provider mit Markensymbol, Authentifizierungsstatus (`models.authStatus`), Modellverfügbarkeit (`models.list`), Live-Daten zu Tarif/Kontingent/Abrechnung, sofern der Provider sie meldet (`usage.status`), und lokalen Sitzungsausgaben der letzten 30 Tage (`sessions.usage`) auflistet. Die Aktion „Aktualisieren“ liest den Anmeldedatenstatus und die Providernutzung erneut ein.
    - Verbindung: eine Einstellungsseite (unter **Verbindungen**), die die eigene Gateway-Verbindung des Dashboards verwaltet – WebSocket-URL, Gateway-Token, Passwort und Standardsitzungsschlüssel – sowie die letzte Momentaufnahme des Handshakes (Status, Betriebszeit, Tick-Intervall, letzte Channel-Aktualisierung). Die Offline-Anmeldesperre behandelt den Fall einer getrennten Verbindung; diese Seite bearbeitet die Verbindung im verbundenen Zustand.
    - Mit Validierung anwenden und neu starten (`config.apply`), anschließend die zuletzt aktive Sitzung aktivieren.
    - Schreibvorgänge enthalten eine Prüfung des Basis-Hashs, um das Überschreiben gleichzeitiger Änderungen zu verhindern.
    - Schreibvorgänge (`config.set`/`config.apply`/`config.patch`) prüfen vorab die aktive SecretRef-Auflösung für Referenzen in der übermittelten Konfigurationsnutzlast; nicht aufgelöste aktive übermittelte Referenzen werden vor dem Schreiben abgelehnt.
    - Beim Speichern von Formularen werden veraltete geschwärzte Platzhalter verworfen, die nicht aus der gespeicherten Konfiguration wiederhergestellt werden können; geschwärzte Werte, die weiterhin gespeicherten Secrets zugeordnet sind, bleiben erhalten.
    - Schema und Formulardarstellung stammen aus `config.schema` / `config.schema.lookup`, einschließlich der Felder `title`/`description`, passender UI-Hinweise, direkter Zusammenfassungen untergeordneter Elemente, Dokumentationsmetadaten für verschachtelte Objekt-/Platzhalter-/Array-/Kompositions-Nodes sowie Plugin- und Channel-Schemas, sofern verfügbar. Der Raw-JSON-Editor ist nur verfügbar, wenn die Momentaufnahme eine sichere Raw-Roundtrip-Konvertierung ermöglicht; andernfalls erzwingt die Control UI den Formularmodus.
    - „Auf gespeicherten Stand zurücksetzen“ im Raw-JSON-Editor bewahrt die ursprünglich im Rohformat erstellte Struktur (Formatierung, Kommentare, `$include`-Layout), statt eine abgeflachte Momentaufnahme neu darzustellen. Dadurch bleiben externe Änderungen beim Zurücksetzen erhalten, sofern die Momentaufnahme sicher im Roundtrip verarbeitet werden kann.
    - Strukturierte SecretRef-Objektwerte werden in Textfeldern des Formulars schreibgeschützt dargestellt, um eine versehentliche Beschädigung durch Umwandlung eines Objekts in eine Zeichenfolge zu verhindern.

  </Accordion>
  <Accordion title="Nutzung">
    - Die aus Sitzungen abgeleitete Analyse von Token und geschätzten Kosten bleibt von der Providerabrechnung getrennt.
    - Providerkarten rufen `usage.status` auf und zeigen die von konfigurierten Provider-Plugins gemeldeten Live-Tarifnamen, Kontingentzeiträume, Guthaben, Ausgaben und Budgets an.
    - Ein Fehler bei der Providernutzung blockiert das Sitzungs-/Kosten-Dashboard nicht; nicht verfügbare Providerkarten zeigen ihren eigenen Fehlerstatus an.

  </Accordion>
  <Accordion title="Debugging, Protokolle, Aktualisierung">
    - Debugging: Momentaufnahmen von Status/Systemzustand/Modellen, Ereignisprotokoll und manuelle RPC-Aufrufe (`status`, `health`, `models.list`).
    - Das Ereignisprotokoll enthält Zeitmessungen für Aktualisierungen/RPCs der Control UI, Zeitmessungen für langsame Chat-/Konfigurationsdarstellungen und Einträge zur Browserreaktionsfähigkeit bei langen Animationsframes oder lang laufenden Aufgaben, sofern der Browser diese PerformanceObserver-Eintragstypen bereitstellt.
    - Protokolle: Live-Anzeige der Gateway-Dateiprotokolle mit Filter/Export (`logs.tail`).
    - Aktualisierung: eine Paket-/Git-Aktualisierung mit anschließendem Neustart (`update.run`) und Neustartbericht ausführen; nach der erneuten Verbindung `update.status` abfragen, um die Version des laufenden Gateways zu überprüfen.

  </Accordion>
  <Accordion title="Hinweise zum Automatisierungsbereich">
    - Durch Auswahl einer Zeile wird eine ganzseitige Detailansicht geöffnet, deren Kopfzeile eine Umschaltung zwischen Aktiv/Pausiert und „Jetzt ausführen“ enthält („bei Fälligkeit ausführen“, „klonen“ und „entfernen“ befinden sich im zugehörigen Menü); der Tab „Einstellungen“ bearbeitet die Automatisierung direkt (Prompt, Details, Häufigkeit, erweiterte Überschreibungen), und der Tab „Ausführungsverlauf“ zeigt die Ausführungen dieser Automatisierung.
    - Die Automatisierungsvorlagen unter der Tabelle füllen das Erstellungsformular mit einem bearbeitbaren Prompt und Zeitplan vorab aus.
    - Bei isolierten Aufgaben ist die Zustellung standardmäßig auf eine Ankündigungszusammenfassung eingestellt; wechseln Sie für rein interne Ausführungen zu „keine“.
    - Channel-/Zielfelder werden angezeigt, wenn „ankündigen“ ausgewählt ist.
    - Der Webhook-Modus verwendet `delivery.mode = "webhook"`, wobei `delivery.to` auf eine gültige HTTP(S)-Webhook-URL gesetzt ist.
    - Für Aufgaben der Hauptsitzung sind die Zustellungsmodi „Webhook“ und „keine“ verfügbar.
    - Zu den erweiterten Bearbeitungsoptionen gehören Löschen nach der Ausführung, Löschen der Agentenüberschreibung, Optionen für exakte/gestaffelte Cron-Ausführung, Überschreibungen für Agentenmodell/Denkmodus und Umschalter für die Best-Effort-Zustellung.
    - Die Formularvalidierung erfolgt direkt mit Fehlern auf Feldebene; ungültige Werte deaktivieren die Schaltfläche zum Speichern, bis sie korrigiert wurden.
    - Legen Sie `cron.webhookToken` fest, um ein dediziertes Bearer-Token zu senden; wird es weggelassen, wird der Webhook ohne Authentifizierungsheader gesendet.
    - `cron.webhook` ist ein veralteter Legacy-Fallback: Führen Sie `openclaw doctor --fix` aus, um gespeicherte Jobs, die noch `notify: true` verwenden, zu einem expliziten Webhook pro Job oder einer expliziten Abschlusszustellung zu migrieren.

  </Accordion>
</AccordionGroup>

## MCP-Seite

Die dedizierte MCP-Seite ist eine Operatoransicht für von OpenClaw verwaltete MCP-Server unter `mcp.servers`. Sie startet MCP-Transporte nicht selbst; verwenden Sie sie, um die gespeicherte Konfiguration zu prüfen und zu bearbeiten, und verwenden Sie anschließend `openclaw mcp doctor --probe`, wenn Sie einen Live-Nachweis des Servers benötigen.

Typischer Arbeitsablauf:

1. Öffnen Sie **MCP** über die Seitenleiste.
2. Prüfen Sie die Übersichtskarten auf die Gesamtzahl sowie die Anzahl aktivierter, OAuth-fähiger und gefilterter Server.
3. Prüfen Sie jede Serverzeile auf Transport, Aktivierungsstatus, Authentifizierung, Filter, Zeitüberschreitungen und Befehlshinweise.
4. Verwalten Sie Server (hinzufügen, aktivieren/deaktivieren, entfernen) auf der Seite **Plugins**, die als einzige interaktive Oberfläche `mcp.servers` schreibt; die Zeilenliste hier verlinkt dorthin.
5. Bearbeiten Sie den abgegrenzten Konfigurationsabschnitt `mcp` für Serverdefinitionen, Header, TLS-/mTLS-Pfade, OAuth-Metadaten, Toolfilter und Codex-Projektionsmetadaten.
6. Verwenden Sie **Speichern** für einen Konfigurationsschreibvorgang oder **Speichern und veröffentlichen**, wenn das laufende Gateway die geänderte Konfiguration anwenden soll.
7. Führen Sie `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` oder `openclaw mcp reload` in einem Terminal aus, um statische Diagnosen, einen Live-Nachweis oder das Verwerfen der zwischengespeicherten Laufzeit durchzuführen.

Die Seite schwärzt URL-ähnliche Werte mit Anmeldedaten vor der Darstellung und setzt Servernamen in Befehlsausschnitten in Anführungszeichen, damit kopierte Befehle auch bei Leerzeichen oder Shell-Metazeichen funktionieren. Vollständige CLI- und Konfigurationsreferenz: [MCP](/de/cli/mcp).

## Tab „Aktivität“

Der Tab „Aktivität“ befindet sich unter **Einstellungen › System** neben „Protokolle“ und „Debugging“. Er ist ein kurzlebiger, browserlokaler Beobachter für Live-Toolaktivitäten und wird aus demselben Gateway-Ereignisstrom `session.tool` / Tool-Ereignisstrom abgeleitet, der auch die Toolkarten im Chat speist. Er fügt keine weitere Gateway-Ereignisfamilie, keinen Endpunkt, keinen dauerhaften Aktivitätsspeicher, keinen Metrik-Feed und keinen externen Beobachterstrom hinzu.

Aktivitätseinträge enthalten nur bereinigte Zusammenfassungen sowie geschwärzte, gekürzte Ausgabevorschauen. Werte von Toolargumenten werden nicht im Aktivitätsstatus gespeichert; die UI zeigt an, dass Argumente ausgeblendet sind, und zeichnet lediglich die Anzahl der Argumentfelder auf. Die speicherinterne Liste ist an den aktuellen Browser-Tab gebunden, bleibt bei der Navigation innerhalb der Control UI erhalten und wird beim Neuladen der Seite, beim Sitzungswechsel oder über **Löschen** zurückgesetzt.

## Operator-Terminal

Das andockbare Operator-Terminal ist standardmäßig deaktiviert. Um es zu aktivieren, setzen Sie `gateway.terminal.enabled: true` und starten Sie das Gateway neu. Das Terminal erfordert eine `operator.admin`-Verbindung und öffnet ein Host-PTY im Arbeitsbereich des aktiven Agenten. Neue Tabs folgen dem aktuell ausgewählten Chat-Agenten.

<Warning>
Das Terminal ist eine uneingeschränkte Host-Shell und übernimmt die Prozessumgebung des Gateways. Aktivieren Sie es nur für vertrauenswürdige Operatorbereitstellungen. OpenClaw verweigert Terminalsitzungen für Agenten mit `sandbox.mode: "all"`; wird ein aktiver Agent in diesen Modus versetzt, werden seine bestehenden und laufenden Terminalsitzungen geschlossen.
</Warning>

Verwenden Sie **Strg + Gravis**, um das Dock ein- oder auszublenden. Das Layout unterstützt das Andocken unten und rechts, passt seine Größe an das Browserfenster an und verwaltet mehrere Shell-Tabs. Informationen zu `gateway.terminal.enabled` und zur optionalen Überschreibung `gateway.terminal.shell` finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration-reference#gateway).

Sitzungen überstehen Verbindungsabbrüche: Beim Neuladen einer Seite, im Ruhezustand des Laptops oder bei einer kurzen Netzwerkunterbrechung wird die Sitzung auf dem Gateway getrennt, statt beendet zu werden, und derselbe Browser-Tab stellt die Verbindung bei der erneuten Verbindung wieder her, wobei die letzte Ausgabe erneut angezeigt wird. Getrennte Sitzungen werden nach `gateway.terminal.detachedSessionTimeoutSeconds` beendet (Standardwert 300 Sekunden; `0` stellt das Beenden bei Verbindungsabbruch wieder her). `terminal.list` zeigt Sitzungen an, an die eine Verbindung hergestellt werden kann, `terminal.attach` übernimmt eine Sitzung (Übernahme im tmux-Stil), und `terminal.text` liest die letzte Ausgabe einer Sitzung als Klartext, ohne eine Verbindung herzustellen – eine Funktion für Agenten und Tools.

Das Terminal ist außerdem als bildschirmfüllendes, ausschließlich für das Terminal vorgesehenes Dokument unter `/?view=terminal` verfügbar. Die iOS- und Android-Apps betten diese Seite in ihre Terminalansichten ein und verwenden dabei die gespeicherten Gateway-Anmeldedaten erneut; die Verfügbarkeit unterliegt denselben Prüfungen für `gateway.terminal.enabled` und `operator.admin`, und die Seite zeigt einen Hinweis an, wenn das verbundene Gateway das Terminal nicht anbietet.

## Browserbereich

Die Control UI enthält einen andockbaren Browserbereich, der den vom Gateway gesteuerten Browser (denselben, den Agenten über das [Browser-Tool](/de/tools/browser-control) steuern) in jedem regulären Webbrowser darstellt – eine native Webview ist nicht erforderlich. Er wird angezeigt, wenn das verbundene Gateway einer `operator.admin`-Verbindung `browser.request` ankündigt; die Globus-Schaltfläche in der Arbeitsbereichsleiste der Sitzung schaltet ihn ein oder aus. Der Bereich zeigt eine Live-Momentaufnahme der Seite mit Tabs, einer bearbeitbaren URL-Leiste, Zurück/Vorwärts/Neu laden und „In Ihrem Browser öffnen“, lässt sich rechts oder unten andocken und leitet Klicks, Scrollen mit dem Mausrad sowie einfache Texteingaben an die entfernte Seite weiter.

Zwei Erfassungsmodi bündeln den Seitenkontext für den Agenten:

- **Annotieren (Stift)**: Zeichnen Sie freihändige Markierungen über die Seite. **An Chat senden** fügt die Striche in den Screenshot ein, hängt das Bild an das Eingabefeld des aktiven Chats an und füllt eine Eingabeaufforderung mit der Seiten-URL, dem Titel und jeder markierten Region vorab aus, damit der Agent genau weiß, was Sie eingekreist haben.
- **Untersuchen (Zeiger)**: Bewegen Sie den Mauszeiger über ein Element, um das Element unter dem Cursor anzuzeigen (Selektor, zugänglicher Name, Rolle, Größe); klicken Sie, um die Details dieses Elements zusammen mit einem hervorgehobenen Screenshot über denselben Eingabeablauf zu senden. Untersuchen, Scrollen mit dem Mausrad und Zurück/Vorwärts benötigen `browser.evaluateEnabled` (standardmäßig aktiviert).

Die macOS-App behält ihre native Link-Browser-Seitenleiste für Links bei, die im Dashboard angeklickt werden; das Browser-Panel funktioniert dort ebenfalls und ermöglicht auf jeder anderen Plattform das Annotieren von Seiten.

## Chatverhalten

  <AccordionGroup>
  <Accordion title="Sende- und Verlaufssemantik">
    - `chat.send` ist **nicht blockierend**: Der Aufruf wird sofort mit `{ runId, status: "started" }` bestätigt, und die Antwort wird über `chat`-Ereignisse gestreamt. Vertrauenswürdige Control-UI-Clients können außerdem optionale ACK-Zeitmetadaten für die lokale Diagnose empfangen.
    - Chat-Uploads akzeptieren Bilder sowie Dateien, die keine Videos sind. Bilder behalten den nativen Bildpfad; andere Dateien werden als verwaltete Medien gespeichert und im Verlauf als Anhangslinks angezeigt.
    - Erneutes Senden mit demselben `idempotencyKey` gibt während der Ausführung `{ status: "in_flight" }` und nach Abschluss `{ status: "ok" }` zurück.
    - Antworten von `chat.history` sind zur Sicherheit der Benutzeroberfläche größenbeschränkt. Wenn Transkripteinträge zu groß sind, kann der Gateway lange Textfelder kürzen, umfangreiche Metadatenblöcke auslassen und übergroße Nachrichten durch einen Platzhalter ersetzen (`[chat.history omitted: message too large]`).
    - Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann die seitliche Leseansicht den vollständigen, für die Anzeige normalisierten Transkripteintrag bei Bedarf über `chat.message.get` abrufen, und zwar anhand von `sessionKey`, der aktiven `agentId`, falls erforderlich, und der Transkript-`messageId`. Wenn der Gateway weiterhin keine weiteren Inhalte zurückgeben kann, zeigt die Leseansicht ausdrücklich an, dass der Inhalt nicht verfügbar ist, statt stillschweigend erneut die gekürzte Vorschau anzuzeigen.
    - Vom Assistenten erzeugte Bilder werden als verwaltete Medienreferenzen dauerhaft gespeichert und über authentifizierte Gateway-Medien-URLs wieder bereitgestellt, sodass ein erneutes Laden nicht davon abhängt, dass rohe Base64-Bilddaten in der Antwort des Chatverlaufs verbleiben.
    - Beim Rendern von `chat.history` entfernt die Control UI aus dem sichtbaren Assistententext ausschließlich für die Anzeige bestimmte Inline-Direktiven-Tags (zum Beispiel `[[reply_to_*]]` und `[[audio_as_voice]]`), Nur-Text-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie offengelegte ASCII-/vollbreite Modellsteuerungstoken. Assistenteneinträge, deren gesamter sichtbarer Text ausschließlich aus dem exakten Stille-Token `NO_REPLY` / `no_reply` oder dem Heartbeat-Bestätigungstoken `HEARTBEAT_OK` besteht, werden ausgelassen.
    - Während eines aktiven Sendevorgangs und der abschließenden Aktualisierung des Verlaufs hält die Chatansicht lokale optimistische Benutzer-/Assistentennachrichten sichtbar, falls `chat.history` kurzzeitig einen älteren Snapshot zurückgibt; das kanonische Transkript ersetzt diese lokalen Nachrichten, sobald der Gateway-Verlauf aufgeholt hat.
    - Live-`chat`-Ereignisse bilden den Zustellungsstatus ab, während `chat.history` aus dem dauerhaften Sitzungstranskript neu aufgebaut wird. Nach abschließenden Tool-Ereignissen lädt die Control UI den Verlauf neu und führt nur einen kleinen optimistischen Nachlauf zusammen; die Transkriptgrenze ist unter [WebChat](/de/web/webchat) dokumentiert.
    - `chat.inject` hängt eine Assistentennotiz an das Sitzungstranskript an und sendet ein `chat`-Ereignis für Aktualisierungen ausschließlich in der Benutzeroberfläche (keine Agentenausführung, keine Kanalzustellung).
    - Die Seitenleiste führt jede geladene aktive Sitzung nach Agentenabschnitt und in den Bereichen „Angeheftet“, „Kanal“, „Arbeit“, „Benutzerdefiniert“ und „Chats“ auf. Eine einzige Aktion „Neue Sitzung“ öffnet den Entwurfsdialog. Das Öffnen einer sichtbaren Zeile verschiebt lediglich die Hervorhebung. Benutzerdefinierte Gruppen können ein- und ausgeklappt sowie per Drag-and-drop neu angeordnet werden, und Sitzungen können auf einer Gruppe oder auf „Chats“ abgelegt werden; Gruppennamen und Reihenfolge werden über den Gateway synchronisiert, während der eingeklappte Zustand im Browser verbleibt. Eine neue Dashboard-Sitzung erhält asynchron einen prägnanten generierten Titel aus ihrer ersten Nachricht, die kein Befehl ist; explizite Namen werden niemals ersetzt. Legen Sie `agents.defaults.utilityModel` (oder `agents.list[].utilityModel`) fest, um diesen separaten Modellaufruf an ein kostengünstigeres Modell weiterzuleiten. Durch Aufklappen eines anderen Agentenabschnitts können Sie die Sitzungen dieses Agenten durchsuchen, ohne den geöffneten Chat zu verlassen.
    - Die Sitzungssuche befindet sich in der Befehlspalette (⌘K oder das Suchfeld oben in der Seitenleiste): Bei Eingabe einer Suchanfrage wird agentenübergreifend eine begrenzte Anzahl übereinstimmender Seiten durchsucht, interne untergeordnete/Cron-Zeilen werden herausgefiltert und sichtbare Treffer neben Navigationsbefehlen aufgelistet. Die Seite „Sitzungen“ enthält weiterhin die vollständige durchsuchbare Liste mit Filtern.
    - Jede Zeile der Seitenleiste bietet direkten Zugriff auf das Anheften sowie ein vollständiges Kontextmenü für den Ungelesen-Status, Umbenennen, Forken, Gruppieren, Archivieren und Löschen. Für mehrfach ausgewählte Zeilen (Cmd-/Strg-Klick, Umschalt-Klick für Bereiche) steht ein Sammelmenü für den Ungelesen-Status, die Gruppierung, das Archivieren und das Löschen zur Verfügung; das Sammelarchivieren/-löschen bleibt deaktiviert, sofern nicht jede ausgewählte Sitzung archiviert werden kann. Eine aktive Ausführung und die Hauptsitzung eines Agenten können nicht archiviert werden. Beim Archivieren oder Löschen der aktuell ausgewählten Sitzung wechselt der Chat zurück zur Hauptsitzung dieses Agenten.
    - In der macOS-App verwendet das OpenClaw-Zeichen den ansonsten leeren nativen Titelleistenbereich neben den Fenstersteuerelementen, statt eine Zeile in der Seitenleiste zu belegen.
    - Bei Desktop-Breiten bleiben die Chat-Steuerelemente in einer kompakten Zeile und werden beim Herunterscrollen im Transkript eingeklappt; durch Hochscrollen, Zurückkehren zum Anfang oder Erreichen des Endes werden die Steuerelemente wiederhergestellt.
    - Aufeinanderfolgende identische Nachrichten, die nur Text enthalten, werden als eine Sprechblase mit einem Anzahl-Badge dargestellt. Nachrichten mit Bildern, Anhängen, Tool-Ausgaben oder Canvas-Vorschauen bleiben unverändert und werden nicht zusammengefasst.
    - Wenn sich der Checkout einer Sitzung auf einem Nicht-Standard-Branch eines GitHub-Repositorys befindet, heftet die Chatansicht Pull-Request-Chips oberhalb des Eingabebereichs an: PR-Nummer, Repository, Branch, Diff-Anzahlen, ein CI-Element sowie Entwurfs-/Zusammengeführt-/Geschlossen-Status, jeweils mit einem Link zum PR. Die Zeile zeigt höchstens zwei Chips an — Live-PRs (offen/Entwurf) zuerst — und eine Schaltfläche „Mehr anzeigen“ blendet den eingeklappten Verlauf zusammengeführter/geschlossener PRs ein. Das CI-Element öffnet ein kleines CI-Überwachungs-Popover mit der Anzahl erfolgreicher/fehlgeschlagener/laufender/übersprungener Prüfungen und einem Link zur Prüfungsseite des PR. Die Erkennung erfolgt serverseitig über `controlUi.sessionPullRequests`, wobei die für den Gateway festgelegten Werte von `GH_TOKEN`/`GITHUB_TOKEN` wiederverwendet werden. Wenn das Ratenlimit der GitHub-API erreicht ist, behalten die Chips den zuletzt bekannten Status bei und zeigen eine Warnung an, dass der Status möglicherweise veraltet ist; das Verwerfen eines Chips blendet ihn für diese Sitzung im aktuellen Browserprofil aus.
    - Das Sitzungs-Diff-Panel zeigt, was der Checkout einer Sitzung tatsächlich geändert hat: Die Branch-Schaltfläche (in der Kopfzeile der Arbeitsbereichsleiste, der Kopfzeile der geteilten Ansicht oder als schwebende Schaltfläche im Chat mit einem Bereich) öffnet das Detail-Panel mit einem Diff pro Datei für Branch-, nicht committete und nicht verfolgte Änderungen gegenüber der Merge-Basis des Standard-Branches des Checkouts — Statuspunkt, Umbenennungspfeil, +/−-Anzahlen pro Datei, einklappbare Dateien und Markierungen für „N unveränderte Zeilen“ zwischen den Hunks. Diffs werden serverseitig über die Gateway-Methode `sessions.diff` (Bereich `operator.read`) berechnet; Binärdateien und übergroße Dateien werden auf reine Statistikeinträge reduziert, und die Schaltfläche wird nur angezeigt, wenn der verbundene Gateway `sessions.diff` bekannt gibt.
    - Die Sitzungsarbeitsbereichsleiste in jedem Chatbereich führt Sitzungsdateien, Projektdateien und Artefakte auf. Standardmäßig ist sie am rechten Rand des Bereichs angedockt; ziehen Sie ihre Kopfzeile (oder verwenden Sie die Andockschaltfläche), um sie nach unten zu verschieben. Die Auswahl wird im aktuellen Browserprofil gespeichert. Eine eingeklappte Leiste belegt überhaupt keinen Platz: Öffnen Sie sie mit ⇧⌘B, dem Datei-Umschalter in der Kopfzeile der geteilten Ansicht oder der schwebenden Datei-Schaltfläche im Chat mit einem Bereich erneut (beide zeigen ein Badge mit der Anzahl geänderter Dateien). Das separate Detail-Panel für Dateien, Tools und Canvas bleibt davon unberührt.
    - Durch Klicken auf eine Dateireferenz im Chat, einen Dateipfad in einer aufgeklappten Tool-Karte zum Lesen/Bearbeiten/Schreiben oder eine Dateizeile in der Arbeitsbereichsleiste wird das Datei-Detail-Panel geöffnet: eine Codeansicht auf Basis von CodeMirror mit Syntaxhervorhebung, Zeilennummern, Sprung zu einer Zeile, Suche innerhalb der Datei, Kopieraktionen und einem Menü zum Öffnen in einem externen Editor. Wenn der Gateway für eine Verbindung mit `operator.admin` die Funktion `sessions.files.set` bekannt gibt, fügt das Panel einen Bearbeitungsmodus mit Änderungsverfolgung und Speichern per Cmd-/Strg-S hinzu; nicht gespeicherte Entwürfe bleiben beim Navigieren zwischen Dateien, Panels und Sitzungen im aktuellen Browser-Tab erhalten, bis sie ausdrücklich gespeichert oder verworfen werden. Speichervorgänge verwenden Compare-and-swap anhand eines von `sessions.files.get` zurückgegebenen Inhalts-Hashs: Wenn die Datei seit dem Laden auf dem Datenträger geändert wurde (zum Beispiel, weil der Agent weitergearbeitet hat), zeigt das Panel einen Konflikthinweis mit den Aktionen „Neu laden“ (neuesten Inhalt übernehmen) und „Überschreiben“ (lokale Bearbeitung beibehalten) an. Schreibvorgänge durchlaufen dieselben dateisystemsicheren Arbeitsbereichsschutzmechanismen wie Lesevorgänge — Pfadbegrenzung, Ablehnung symbolischer Links/harter Links und eine Obergrenze von 256 KB für UTF-8 — und überschreiben ausschließlich vorhandene Dateien; der Editor erstellt oder löscht niemals Dateien.
    - Die Leiste für Hintergrundaufgaben in jedem Chatbereich führt die Hintergrundaufgaben und Subagenten des aktuellen Agenten auf (`tasks.list`, nach Agent eingegrenzt und durch `task`-Ereignisse aktuell gehalten): Laufende Arbeiten zeigen einen live aktualisierten Zeitgeber für die verstrichene Zeit, die Anzahl der Tool-Nutzungen, das aktuell verwendete Tool und ein Steuerelement zum Stoppen; der einklappbare Abschnitt für abgeschlossene Aufgaben ergänzt die Ausführungsdauer; und ein Link „Transkript anzeigen“ öffnet die untergeordnete Sitzung der Aufgabe im Bereich. Öffnen Sie die Leiste mit dem Aktivitätsumschalter in der Kopfzeile der geteilten Ansicht oder der schwebenden Aktivitätsschaltfläche im Chat mit einem Bereich — der Aufgaben-Snapshot wird vorab geladen, sodass beide ein Badge mit der Anzahl laufender Aufgaben anzeigen, ohne dass die Leiste zuerst geöffnet werden muss. Die Seite „Aufgaben“ bleibt das vollständige agentenübergreifende Verzeichnis.
    - Die Arbeitsbereichsleiste, die Leiste für Hintergrundaufgaben und das Detail-Panel passen sich an die jeweilige Breite jedes Bereichs statt an die Fensterbreite an: In einem schmalen Bereich oder kompakten Fenster werden beide Leisten als untere Streifen dargestellt (Steuerelemente zum seitlichen Andocken bleiben ausgeblendet, bis der Bereich breiter wird; die Arbeitsbereichsleiste hat Vorrang beim seitlichen Platz, wenn nur eine Spalte passt), und das Detail-Panel wird unterhalb des Threads mit einem horizontalen Größenänderungsgriff angeordnet, statt sich mit ihm eine Zeile zu teilen. In Ansichtsbereichen mit Smartphone-Größe wird das Detail-Panel weiterhin im Vollbildmodus geöffnet.
    - Die Modell- und Denkmodus-Auswahlfelder in der Chat-Kopfzeile aktualisieren die aktive Sitzung sofort über `sessions.patch`; es handelt sich um dauerhafte Sitzungsüberschreibungen und nicht um Sendeoptionen, die nur für eine einzelne Anfrage gelten.
    - **Geteilte Ansicht:** Öffnen Sie sie über die schwebende Umschalterzeile oben rechts (neben den Umschaltern für Sitzungs-Diff, Hintergrundaufgaben und Sitzungsdateien) und teilen Sie anschließend den aktiven Bereich nach rechts oder unten, um so viele Bereiche zu erstellen, wie Platz finden. Jeder Bereich verfügt über eine eigene Sitzung, ein eigenes Transkript, einen eigenen Eingabebereich und einen eigenen Tool-Stream.
    - Ziehen Sie eine Sitzung aus der Seitenleiste in den Chat, um sie in einem Bereich zu öffnen. Eine animierte Ablagevorschau gleitet zwischen den Zonen und kennzeichnet das Ergebnis — „Teilen“ über genau der Hälfte, die ein neuer Bereich belegen wird, „Hier öffnen“ über einem vollständigen Bereich — und das Ablegen funktioniert auch im Modus mit einem Bereich.
    - Der aktive geteilte Bereich steuert die Auswahl in der Seitenleiste und die URL. Jeder Bereich besitzt eine eigene Kopfzeile mit dem Sitzungstitel sowie Steuerelementen für Arbeitsbereichsleiste, Teilen und Schließen; Trennlinien ändern die Größe von Spalten und gestapelten Bereichen, und der Browser speichert das Layout lokal über erneute Ladevorgänge hinweg.
    - Auf schmalen Bildschirmen behält die geteilte Ansicht das Layout bei, rendert jedoch nur den aktiven Bereich einschließlich seiner Kopfzeile mit dem Steuerelement zum Schließen.
    - Wenn Sie eine Nachricht senden, während eine Änderung der Modellauswahl für dieselbe Sitzung noch gespeichert wird, wartet der Eingabebereich auf diese Sitzungsaktualisierung, bevor `chat.send` aufgerufen wird, sodass beim Senden das ausgewählte Modell verwendet wird.
    - Durch Eingabe von `/new` wird dieselbe neue Dashboard-Sitzung wie mit „Neuer Chat“ erstellt und ausgewählt, außer wenn `session.dmScope: "main"` konfiguriert ist und die aktuelle übergeordnete Sitzung die Hauptsitzung des Agenten ist; in diesem Fall wird die Hauptsitzung direkt zurückgesetzt. Durch Eingabe von `/reset` wird weiterhin der explizite direkte Reset des Gateway für die aktuelle Sitzung verwendet.
    - Die Chat-Modellauswahl fordert die konfigurierte Modellansicht des Gateway an. Wenn `agents.defaults.models` vorhanden ist, steuert diese Positivliste die Auswahl, einschließlich `provider/*`-Einträgen, durch die Provider-spezifische Kataloge dynamisch bleiben. Andernfalls zeigt die Auswahl explizite `models.providers.*.models`-Einträge sowie Provider mit nutzbarer Authentifizierung an. Der vollständige Katalog bleibt über den Debug-RPC `models.list` mit `view: "all"` verfügbar.
    - Wenn aktuelle Gateway-Berichte zur Sitzungsnutzung die aktuelle Anzahl der Kontexttoken enthalten, zeigt die Symbolleiste des Chat-Eingabebereichs einen kleinen Ring für die Kontextnutzung mit dem verwendeten Prozentsatz an. Öffnen Sie den Ring, um das aktuelle Kontextfenster, die Token-Anzahlen der letzten Ausführung und die geschätzten Gesamtkosten, die Provider-/Modellidentität sowie, sofern gemeldet, die Aufschlüsselung der Eingabe-/Ausgabe-/Cache-Kosten der neuesten Provider-Antwort anzuzeigen. Bei hoher Kontextauslastung wechselt der Ring zu einem Warnstil und zeigt bei empfohlenen Compaction-Stufen eine kompakte Schaltfläche an, die den normalen Compaction-Pfad der Sitzung ausführt. Veraltete Token-Snapshots werden ausgeblendet, bis der Gateway erneut aktuelle Nutzungsdaten meldet.

  </Accordion>
  <Accordion title="Sprechmodus (Browser-Echtzeit)">
    Der Sprechmodus verwendet einen registrierten Echtzeit-Sprach-Provider. Konfigurieren Sie OpenAI mit `talk.realtime.provider: "openai"` sowie einem `openai`-API-Schlüsselprofil, `talk.realtime.providers.openai.apiKey` oder `OPENAI_API_KEY`. OpenAI Realtime verwendet die öffentliche Platform API und erfordert einen Platform-API-Schlüssel; eine Codex-OAuth-Anmeldung erfüllt diese Anforderung nicht. Konfigurieren Sie Google mit `talk.realtime.provider: "google"` sowie `talk.realtime.providers.google.apiKey`. Der Browser erhält niemals einen regulären Provider-API-Schlüssel: OpenAI erhält ein kurzlebiges Realtime-Client-Secret für WebRTC und Google Live erhält ein einmalig verwendbares, eingeschränktes Live-API-Authentifizierungstoken für eine Browser-WebSocket-Sitzung, wobei Anweisungen und Werkzeugdeklarationen durch das Gateway im Token festgeschrieben werden. Provider, die nur eine Backend-Echtzeit-Bridge bereitstellen, werden über den Gateway-Relay-Transport ausgeführt. Dadurch verbleiben Anmeldedaten und Anbieter-Sockets serverseitig, während Browser-Audio über authentifizierte Gateway-RPCs übertragen wird. Der Prompt der Realtime-Sitzung wird vom Gateway zusammengestellt; `talk.client.create` akzeptiert keine vom Aufrufer bereitgestellten Überschreibungen der Anweisungen.

    Dauerhafte Standardeinstellungen für Provider, Modell, Stimme, Transport, Reasoning-Aufwand, exakten VAD-Schwellenwert, Stilledauer und Präfix-Padding befinden sich unter **Settings → Communications → Talk**; Änderungen erfordern `operator.admin`-Zugriff. Bei konfiguriertem Gateway-Relay wird der Backend-Relay-Pfad erzwungen. Bei konfiguriertem WebRTC verbleibt die Sitzung unter Kontrolle des Clients und schlägt fehl, statt stillschweigend auf Relay zurückzufallen, wenn der Provider keine Browser-Sitzung erstellen kann.

    Das Steuerelement für den Sprechmodus ist die Mikrofonschaltfläche in der Werkzeugleiste des Eingabebereichs. Das zugehörige Aufklappmenü führt **System default** und jedes vom Browser bereitgestellte Mikrofon auf, einschließlich USB-, Bluetooth- und virtueller Eingänge. Die ausgewählte Geräte-ID verbleibt lokal im Browser und wird niemals an das Gateway gesendet. Wenn genau dieses Gerät nicht mehr verfügbar ist, fordert der Sprechmodus Sie auf, einen anderen Eingang auszuwählen, statt unbemerkt über ein anderes Mikrofon aufzunehmen. Während der Sprechmodus aktiv ist, wird die Mikrofonschaltfläche zu einem pillenförmigen Steuerelement mit einer Live-Anzeige des Eingangspegels. Durch Anklicken wird die Spracheingabe beendet; beim Darüberfahren wird das Stoppsymbol angezeigt. Screenreader geben `Connecting voice input...`, `Listening...` oder `Asking OpenClaw...` aus, während ein Echtzeit-Werkzeugaufruf über `talk.client.toolCall` das konfigurierte größere Modell konsultiert. Zum Beenden einer laufenden Agentenantwort bleibt daneben ein separates quadratisches Steuerelement **Stop** verfügbar.

    Live-Smoke-Test für Maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` überprüft die OpenAI-Backend-WebSocket-Bridge, den OpenAI-Browser-WebRTC-SDP-Austausch, die Einrichtung des Google-Live-Browser-WebSockets mit eingeschränktem Token und den Browseradapter des Gateway-Relays mit simulierten Mikrofonmedien. Der Befehl gibt nur den Provider-Status aus und protokolliert keine Secrets.

  </Accordion>
  <Accordion title="Stoppen und abbrechen">
    - Klicken Sie auf **Stop** (ruft `chat.abort` auf).
    - Während ein Lauf aktiv ist, werden normale Folgenachrichten in die Warteschlange gestellt. Klicken Sie bei einer Nachricht in der Warteschlange auf **Steer**, um diese Folgenachricht in den laufenden Turn einzuspeisen.
    - Geben Sie `/stop` ein (oder eigenständige Abbruchphrasen wie `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), um außerhalb des regulären Ablaufs abzubrechen.
    - `chat.abort` unterstützt `{ sessionKey }` (ohne `runId`), um alle aktiven Läufe dieser Sitzung abzubrechen.

  </Accordion>
  <Accordion title="Teilweise Aufbewahrung bei Abbruch">
    - Wenn ein Lauf abgebrochen wird, kann unvollständiger Assistententext weiterhin in der Benutzeroberfläche angezeigt werden.
    - Das Gateway speichert abgebrochenen unvollständigen Assistententext im Transkriptverlauf, wenn eine gepufferte Ausgabe vorhanden ist.
    - Gespeicherte Einträge enthalten Abbruchmetadaten, damit Transkriptverarbeiter unvollständige Abbruchausgaben von regulär abgeschlossenen Ausgaben unterscheiden können.

  </Accordion>
</AccordionGroup>

## Verbindungsverlust und Wiederherstellung der Verbindung

Sobald eine Sitzung hergestellt ist, werden Sie durch eine unterbrochene Gateway-Verbindung nicht abgemeldet. Das Dashboard
bleibt sichtbar und zeigt unter der oberen Leiste ein schwebendes bernsteinfarbenes Element „Gateway-Verbindung verloren — Verbindung wird wiederhergestellt …“, während der Client automatisch mit Backoff erneut versucht, die Verbindung herzustellen (800 ms bis zu 15 s). Live-Aktualisierungen und
Echtzeit-/Sitzungsaktionen werden pausiert, bis die Verbindung wiederhergestellt ist; **Retry now** im Element erzwingt einen
sofortigen Versuch. Der Chat bleibt bearbeitbar: Normale Text- und Anhangsendungen werden im Gateway-/sitzungsbezogenen Browserspeicher
des aktuellen Tabs aufbewahrt, als auf die Wiederherstellung der Verbindung wartend angezeigt und automatisch gesendet,
sobald das Gateway wieder erreichbar ist. Live-Steuerelemente und Slash-Befehle bleiben offline nicht verfügbar.

Wenn dieser Browser bereits über Anmeldedaten verfügt (ein konfiguriertes Token/Passwort oder ein genehmigtes Geräte-
token), zeigen der erste Aufruf und Neuladevorgänge ein kleines animiertes OpenClaw-Symbol, während die Verbindung
hergestellt wird, statt kurzzeitig die Anmeldemaske einzublenden. Die Anmeldemaske erscheint nur, wenn noch keine Anmeldedaten
gespeichert sind oder wenn das Gateway sie aktiv ablehnt (falsches Token/Passwort, widerrufene Kopplung) —
also in Zuständen, die Ihre Eingabe erfordern, statt lediglich abzuwarten.

## PWA-Installation und Web Push

Die Control UI enthält eine `manifest.webmanifest` und einen Service Worker, sodass moderne Browser sie als eigenständige PWA installieren können. Mit Web Push kann das Gateway die installierte PWA durch Benachrichtigungen aktivieren, selbst wenn der Tab oder das Browserfenster nicht geöffnet ist.

Wenn die Seite direkt nach einem OpenClaw-Update **Protocol mismatch** anzeigt, öffnen Sie zunächst das Dashboard mit `openclaw dashboard` erneut und führen Sie eine vollständige Aktualisierung durch. Falls der Fehler weiterhin auftritt, löschen Sie die Websitedaten für den Dashboard-Ursprung oder testen Sie in einem privaten Browserfenster. Ein alter Tab oder der Service-Worker-Cache des Browsers kann weiterhin ein Control-UI-Bundle von vor dem Update mit dem neueren Gateway ausführen.

| Oberfläche                                            | Funktion                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-Manifest. Browser bieten „Install app“ an, sobald es erreichbar ist. |
| `ui/public/sw.js`                                     | Service Worker, der `push`-Ereignisse und Klicks auf Benachrichtigungen verarbeitet. |
| `push/vapid-keys.json` (im OpenClaw-Statusverzeichnis) | Automatisch generiertes VAPID-Schlüsselpaar zum Signieren von Web-Push-Nutzdaten. |
| `push/web-push-subscriptions.json`                    | Dauerhaft gespeicherte Endpunkte von Browserabonnements.           |

Überschreiben Sie das VAPID-Schlüsselpaar über Umgebungsvariablen des Gateway-Prozesses, wenn Sie Schlüssel fest vorgeben möchten (Bereitstellungen auf mehreren Hosts, Rotation von Secrets oder Tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (Standardwert: `https://openclaw.ai`)

Die Control UI verwendet diese nach Geltungsbereich beschränkten Gateway-Methoden, um Browserabonnements zu registrieren und zu testen:

- `push.web.vapidPublicKey` ruft den aktiven öffentlichen VAPID-Schlüssel ab.
- `push.web.subscribe` registriert einen `endpoint` zusammen mit `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` entfernt einen registrierten Endpunkt.
- `push.web.test` sendet eine Testbenachrichtigung an das Abonnement des Aufrufers.

<Note>
Web Push ist unabhängig vom iOS-APNS-Relay-Pfad (siehe [Konfiguration](/de/gateway/configuration) für Relay-gestützte Push-Benachrichtigungen) und von der Methode `push.test`, die auf die native Kopplung mobiler Geräte ausgerichtet ist.
</Note>

## Gehostete Einbettungen

Assistentennachrichten können gehostete Webinhalte mit dem Shortcode `[embed ...]` inline darstellen. Die Sandbox-Richtlinie des Iframes wird durch `gateway.controlUi.embedSandbox` gesteuert:

Das mitgelieferte Canvas-Plugin stellt außerdem [`show_widget`](/tools/show-widget) bereit, um eigenständiges SVG oder HTML direkt aus einem Werkzeugaufruf darzustellen. Der Browser gibt die Gateway-Fähigkeit `inline-widgets` bekannt, und das resultierende Canvas-Dokument bleibt verfügbar, wenn der Chatverlauf neu geladen wird. Über Kanäle ausgelöste Läufe erhalten dieses Werkzeug nicht.

<Tabs>
  <Tab title="strict">
    Deaktiviert die Skriptausführung innerhalb gehosteter Einbettungen.
  </Tab>
  <Tab title="scripts (Standard)">
    Ermöglicht interaktive Einbettungen unter Beibehaltung der Ursprungsisolation; dies reicht in der Regel für eigenständige Browserspiele/-Widgets aus.
  </Tab>
  <Tab title="trusted">
    Ergänzt `allow-same-origin` zusätzlich zu `allow-scripts` für Dokumente derselben Website, die bewusst weitergehende Berechtigungen benötigen.
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
Verwenden Sie `trusted` nur, wenn das eingebettete Dokument tatsächlich Verhalten desselben Ursprungs benötigt. Für die meisten von Agenten generierten Spiele und interaktiven Canvas-Inhalte ist `scripts` die sicherere Wahl.
</Warning>

Absolute externe `http(s)`-Einbettungs-URLs bleiben standardmäßig gesperrt. Damit `[embed url="https://..."]` Seiten von Drittanbietern laden kann, setzen Sie `gateway.controlUi.allowExternalEmbedUrls: true`.

## Breite von Chatnachrichten

Das Chattranskript verwendet einen zentrierten, gut lesbaren Rahmen, der am Eingabebereich ausgerichtet ist. Ausgaben des Assistenten und von Werkzeugen bleiben linksbündig, während Benutzerblasen innerhalb dieses Rahmens rechtsbündig bleiben. Bereitstellungen auf breiten Monitoren können die Transkriptbreite ohne Änderungen am mitgelieferten CSS überschreiben, indem `gateway.controlUi.chatMessageMaxWidth` festgelegt wird:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Der Wert wird validiert, bevor er den Browser erreicht. Unterstützte Formen umfassen einfache Längen und Prozentangaben wie `960px` oder `82%` sowie eingeschränkte Breitenausdrücke mit `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` und `fit-content(...)`.

## Tailnet-Zugriff (empfohlen)

<Tabs>
  <Tab title="Integriertes Tailscale Serve (bevorzugt)">
    Belassen Sie das Gateway auf der Loopback-Schnittstelle und lassen Sie Tailscale Serve es per HTTPS als Proxy bereitstellen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Öffnen Sie `https://<magicdns>/` (oder Ihren konfigurierten `gateway.controlUi.basePath`).

    Standardmäßig können Control-UI-/WebSocket-Serve-Anfragen über Tailscale-Identitätsheader (`tailscale-user-login`) authentifiziert werden, wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist. OpenClaw überprüft die Identität, indem es die Adresse aus `x-forwarded-for` mit `tailscale whois` auflöst und mit dem Header abgleicht. Diese Anfragen werden nur akzeptiert, wenn sie die Loopback-Schnittstelle mit den `x-forwarded-*`-Headern von Tailscale erreichen. Bei Control-UI-Operatorsitzungen mit Browsergeräteidentität überspringt dieser verifizierte Serve-Pfad außerdem den Umlauf zur Gerätekopplung. Browser ohne Geräteidentität und Verbindungen mit Node-Rolle durchlaufen weiterhin die normalen Geräteprüfungen. Setzen Sie `gateway.auth.allowTailscale: false`, wenn Sie auch für Serve-Datenverkehr explizite Anmeldedaten in Form eines gemeinsam verwendeten Secrets verlangen möchten, und verwenden Sie anschließend `gateway.auth.mode: "token"` oder `"password"`.

    Für diesen asynchronen Serve-Identitätspfad werden fehlgeschlagene Authentifizierungsversuche für dieselbe Client-IP und denselben Authentifizierungsgeltungsbereich vor Schreibvorgängen für die Ratenbegrenzung serialisiert. Gleichzeitige fehlerhafte Wiederholungsversuche desselben Browsers können daher bei der zweiten Anfrage `retry later` anzeigen, statt dass zwei einfache Abweichungen parallel miteinander konkurrieren.

    <Warning>
    Die tokenlose Serve-Authentifizierung setzt voraus, dass dem Gateway-Host vertraut wird. Wenn nicht vertrauenswürdiger lokaler Code auf diesem Host ausgeführt werden kann, müssen Sie die Authentifizierung per Token/Passwort verlangen.
    </Warning>

  </Tab>
  <Tab title="An Tailnet binden + Token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Öffnen Sie `http://<tailscale-ip>:18789/` (oder Ihren konfigurierten `gateway.controlUi.basePath`).

    Fügen Sie das passende gemeinsam verwendete Secret in die UI-Einstellungen ein (wird als `connect.params.auth.token` oder `connect.params.auth.password` gesendet).

  </Tab>
</Tabs>

## Unsicheres HTTP

Wenn Sie das Dashboard über unverschlüsseltes HTTP (`http://<lan-ip>` oder `http://<tailscale-ip>`) öffnen, wird der Browser in einem **nicht sicheren Kontext** ausgeführt und blockiert WebCrypto. Standardmäßig **blockiert** OpenClaw Control-UI-Verbindungen ohne Geräteidentität.

Dokumentierte Ausnahmen:

- Nur für localhost geltende Kompatibilität mit unsicherem HTTP über `gateway.controlUi.allowInsecureAuth=true`
- erfolgreiche Control-UI-Operatorauthentifizierung über `gateway.auth.mode: "trusted-proxy"`
- Notfalloption `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Empfohlene Lösung:** Verwenden Sie HTTPS (Tailscale Serve) oder öffnen Sie die Benutzeroberfläche lokal unter `https://<magicdns>/` (Serve) oder `http://127.0.0.1:18789/` (auf dem Gateway-Host).

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

    `allowInsecureAuth` ist lediglich ein lokaler Kompatibilitätsschalter:

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
    `dangerouslyDisableDeviceAuth` deaktiviert die Prüfungen der Geräteidentität in der Control UI und stellt eine erhebliche Herabstufung der Sicherheit dar. Machen Sie diese Änderung nach dem Notfalleinsatz schnellstmöglich rückgängig.
    </Warning>

  </Accordion>
  <Accordion title="Hinweis zu vertrauenswürdigen Proxys">
    - Eine erfolgreiche Authentifizierung über einen vertrauenswürdigen Proxy kann **operator**-Control-UI-Sitzungen ohne Geräteidentität zulassen.
    - Dies gilt **nicht** für Control-UI-Sitzungen mit der Node-Rolle.
    - Loopback-Reverse-Proxys auf demselben Host erfüllen weiterhin nicht die Authentifizierung über einen vertrauenswürdigen Proxy; siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Hinweise zur HTTPS-Einrichtung finden Sie unter [Tailscale](/de/gateway/tailscale).

## Content-Security-Policy

Die Control UI wird mit einer strikten `img-src`-Richtlinie ausgeliefert: Zulässig sind nur Ressourcen vom **selben Ursprung**, `data:`-URLs und lokal erzeugte `blob:`-URLs. Entfernte `http(s)`- und protokollrelative Bild-URLs werden vom Browser abgelehnt und lösen niemals Netzwerkanfragen aus.

In der Praxis:

- Avatare und Bilder, die unter relativen Pfaden bereitgestellt werden (zum Beispiel `/avatars/<id>`), werden weiterhin dargestellt. Dies gilt auch für authentifizierte Avatar-Routen, welche die UI abruft und in lokale `blob:`-URLs umwandelt.
- Eingebettete `data:image/...`-URLs werden weiterhin dargestellt.
- Von der Control UI erstellte lokale `blob:`-URLs werden weiterhin dargestellt.
- Avatare für GitHub-Linkvorschauen werden vom Gateway vom festgelegten Avatar-Host von GitHub abgerufen und als größenbeschränkte `data:`-URLs zurückgegeben; der Browser des Operators kontaktiert den entfernten Avatar-Host niemals.
- Von Kanalmetadaten ausgegebene entfernte Avatar-URLs werden in den Avatar-Hilfsfunktionen der Control UI entfernt und durch das integrierte Logo/Abzeichen ersetzt. Dadurch kann ein kompromittierter oder bösartiger Kanal den Browser eines Operators nicht dazu zwingen, beliebige entfernte Bilder abzurufen.

Dies ist immer aktiviert und nicht konfigurierbar.

## Authentifizierung der Avatar-Route

Wenn die Gateway-Authentifizierung konfiguriert ist, erfordert der Avatar-Endpunkt der Control UI dasselbe Gateway-Token wie der Rest der API:

- `GET /avatar/<agentId>` gibt das Avatarbild nur an authentifizierte Aufrufer zurück. `GET /avatar/<agentId>?meta=1` gibt die Avatar-Metadaten nach derselben Regel zurück.
- Nicht authentifizierte Anfragen an beide Routen werden abgelehnt (entsprechend der verwandten Route für Assistentenmedien), sodass die Avatar-Route auf ansonsten geschützten Hosts keine Agentenidentität offenlegen kann.
- Die Control UI übermittelt das Gateway-Token beim Abrufen von Avataren als Bearer-Header und verwendet authentifizierte Blob-URLs, damit das Bild weiterhin in Dashboards dargestellt wird.

Wenn Sie die Gateway-Authentifizierung deaktivieren (auf gemeinsam genutzten Hosts nicht empfohlen), wird entsprechend dem restlichen Gateway auch die Avatar-Route nicht authentifiziert.

## Authentifizierung der Route für Assistentenmedien

Wenn die Gateway-Authentifizierung konfiguriert ist, verwenden lokale Medienvorschauen des Assistenten eine zweistufige Route:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` erfordert die normale Operatorauthentifizierung der Control UI; der Browser sendet beim Prüfen der Verfügbarkeit das Gateway-Token als Bearer-Header.
- Erfolgreiche Metadatenantworten enthalten ein kurzlebiges `mediaTicket`, dessen Geltungsbereich auf genau diesen Quellpfad beschränkt ist.
- Vom Browser dargestellte Bild-, Audio-, Video- und Dokument-URLs verwenden `mediaTicket=<ticket>` anstelle des aktiven Gateway-Tokens oder Passworts. Das Ticket läuft schnell ab und kann keine andere Quelle autorisieren.

Dadurch bleibt die Mediendarstellung mit nativen Medienelementen des Browsers kompatibel, ohne wiederverwendbare Gateway-Anmeldedaten in sichtbaren Medien-URLs offenzulegen.

## Genehmigungslinks

Benachrichtigungen über Operatorgenehmigungen können per Deep Link auf ein eigenständiges Genehmigungsdokument verweisen, das unter dem reservierten Namensraum `${controlUiBasePath}/approve/{approvalId}` bereitgestellt wird (zum Beispiel `/approve/<approvalId>` oder bei konfiguriertem Basispfad `/openclaw/approve/<approvalId>`). Die URL bleibt während der gesamten Gültigkeitsdauer der Genehmigung stabil und kann sicher zwischen Ihren eigenen Geräten weitergeleitet werden: Sie identifiziert die Genehmigung, autorisiert sie jedoch niemals.

- Der aus einem Segment bestehende Namensraum `/approve/<approvalId>` wird vom Gateway vor den HTTP-Routen von Plugins für **alle** HTTP-Methoden reserviert. Daher kann eine Plugin-Route ein Genehmigungsdokument niemals verdecken oder abfangen.
- Zum Öffnen eines Genehmigungsdokuments ist dieselbe Gateway-Authentifizierung wie für den Rest der Control UI erforderlich (Token/Passwort, Tailscale-Serve-Identität oder Identität eines vertrauenswürdigen Proxys); Anmeldedaten sind niemals Bestandteil der Genehmigungs-URL.
- Wenn die Bereitstellung der Control UI deaktiviert ist, geben Anfragen an den Namensraum `404` zurück, anstatt an Plugin-Handler weitergereicht zu werden.
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

Richten Sie die UI anschließend auf die WebSocket-URL Ihres Gateways aus (z. B. `ws://127.0.0.1:18789`).

## Leere Control-UI-Seite

Wenn der Browser ein leeres Dashboard lädt und DevTools keinen hilfreichen Fehler anzeigt, hat möglicherweise eine Erweiterung oder ein früh ausgeführtes Inhaltsskript die Auswertung der JavaScript-Modulanwendung verhindert. Die statische Seite enthält einen einfachen HTML-Wiederherstellungsbereich, der angezeigt wird, wenn `<openclaw-app>` nach dem Start nicht registriert ist.

Verwenden Sie nach einer Änderung der Browserumgebung im Bereich die Aktion **Try again**, oder laden Sie die Seite nach den folgenden Prüfungen manuell neu:

- Deaktivieren Sie Erweiterungen, die Inhalte in alle Seiten einschleusen, insbesondere Erweiterungen mit `<all_urls>`-Inhaltsskripten.
- Versuchen Sie es mit einem privaten Fenster, einem bereinigten Browserprofil oder einem anderen Browser.
- Lassen Sie das Gateway weiterlaufen und überprüfen Sie nach dem Browserwechsel dieselbe Dashboard-URL.

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
    - Wenn Sie über `gatewayUrl` einen vollständigen `ws://`- oder `wss://`-Endpunkt übergeben, codieren Sie den Wert als URL, damit der Browser die Abfragezeichenfolge korrekt analysiert.
    - `token` sollte nach Möglichkeit über das URL-Fragment (`#token=...`) übergeben werden. Fragmente werden nicht an den Server gesendet, wodurch Offenlegungen in Anfrageprotokollen und über den Referer vermieden werden. Veraltete `?token=`-Abfrageparameter werden aus Kompatibilitätsgründen weiterhin einmalig importiert, jedoch nur als Rückgriff, und unmittelbar nach dem Bootstrap entfernt.
    - `password` wird ausschließlich im Arbeitsspeicher aufbewahrt.
    - Wenn `gatewayUrl` festgelegt ist, greift die UI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Geben Sie `token` (oder `password`) ausdrücklich an; fehlende explizite Anmeldedaten sind ein Fehler.
    - Verwenden Sie `wss://`, wenn sich das Gateway hinter TLS befindet (Tailscale Serve, HTTPS-Proxy usw.).
    - `gatewayUrl` wird nur in einem Fenster der obersten Ebene akzeptiert (nicht eingebettet), um Clickjacking zu verhindern.
    - Öffentliche Control-UI-Bereitstellungen außerhalb von Loopback müssen `gateway.controlUi.allowedOrigins` ausdrücklich festlegen (vollständige Ursprünge). Private LAN-/Tailnet-Ladevorgänge vom selben Ursprung über Loopback-, RFC1918-/Link-Local-, `.local`-, `.ts.net`- oder Tailscale-CGNAT-Hosts werden akzeptiert, ohne den Rückgriff auf den Host-Header zu aktivieren.
    - Beim Start des Gateways können lokale Ursprünge wie `http://localhost:<port>` und `http://127.0.0.1:<port>` anhand der effektiven Laufzeitbindung und des Ports vorbelegt werden. Entfernte Browserursprünge benötigen jedoch weiterhin explizite Einträge.
    - Verwenden Sie `gateway.controlUi.allowedOrigins: ["*"]` ausschließlich für streng kontrollierte lokale Tests; dies bedeutet, dass jeder Browserursprung zugelassen wird, nicht „den von mir verwendeten Host abgleichen“.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` aktiviert den Rückgriff auf den Host-Header für die Ursprungsermittlung, stellt jedoch einen gefährlichen Sicherheitsmodus dar.

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
