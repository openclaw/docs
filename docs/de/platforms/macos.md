---
read_when:
    - Installieren der macOS-App
    - Entscheidung zwischen lokalem und entferntem Gateway-Modus unter macOS
    - Auf der Suche nach Downloads für macOS-App-Releases
summary: OpenClaw-Menüleisten-App für macOS installieren und verwenden
title: macOS-App
x-i18n:
    generated_at: "2026-07-24T05:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b319d72bcbffcf91b6bc012d352c2cf647abd66e08ab0146cf98f5edfae3bca1
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der OpenClaw-**Menüleistenbegleiter**: native Menüleistenoberfläche, macOS-Berechtigungsabfragen, Benachrichtigungen, WebChat, Spracheingabe, Canvas und auf dem Mac gehostete Node-Werkzeuge wie `system.run`.

Verwenden Sie **Quick Chat** als Spotlight-ähnlichen Editor für die Hauptsitzung, ohne ein vollständiges Fenster zu öffnen. Drücken Sie standardmäßig Wahltaste-Leertaste (⌥Leertaste), wählen Sie die Funktion im Menüleistenmenü aus oder legen Sie unter **Einstellungen → Allgemein** ein anderes Tastaturkürzel fest.

Benötigen Sie nur die CLI und das Gateway? Beginnen Sie mit [Erste Schritte](/de/start/getting-started).

## Download

Laden Sie Builds der macOS-App von den [OpenClaw-Veröffentlichungen auf GitHub](https://github.com/openclaw/openclaw/releases) herunter.
Wenn eine Veröffentlichung Assets für die macOS-App enthält, suchen Sie nach:

- `OpenClaw-<version>.dmg` (bevorzugt)
- `OpenClaw-<version>.zip`

Einige Veröffentlichungen enthalten nur CLI-, Nachweis- oder Windows-Assets. Wenn die neueste Veröffentlichung kein Asset für die macOS-App enthält, verwenden Sie die neueste Veröffentlichung mit einem solchen Asset oder erstellen Sie die App mit der [macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup) aus dem Quellcode.

## Erster Start

1. Installieren und starten Sie **OpenClaw.app**.
2. Wählen Sie **This Mac** für ein lokales Gateway aus oder stellen Sie eine Verbindung zu einem entfernten Gateway her.
3. Warten Sie, während die App die passende CLI-Laufzeit installiert. Im lokalen Modus installiert und startet sie außerdem das Gateway.
4. Stellen Sie die Inferenz mit einer Live-Modellprüfung her. Nach erfolgreicher Prüfung übernimmt OpenClaw die verbleibende Einrichtung.
5. Schließen Sie die Checkliste für macOS-Berechtigungen ab und senden Sie die Onboarding-Testnachricht.

Wenn die App ein vorhandenes Gateway erreicht, dessen Standard-Agent über ein konfiguriertes Modell verfügt, betrachtet sie dieses Gateway als bereits eingerichtet, überspringt das Provider-Onboarding und OpenClaw und öffnet das Dashboard. Wenn keine Verbindung zum Gateway hergestellt werden kann oder dessen Standard-Agent kein Modell hat, bleibt das Inferenz-Onboarding zur Wiederherstellung verfügbar.

Verwenden Sie für die Einrichtung von CLI und Gateway [Erste Schritte](/de/start/getting-started).
Informationen zur Wiederherstellung von Berechtigungen finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Aktualisierungen

Die Aktualisierungskarte im Dashboard gibt an, was die App aktualisiert:

- **Mac-App + Gateway aktualisieren** bedeutet, dass die signierte App das lokale, von launchd verwaltete Gateway besitzt. Sparkle aktualisiert zuerst die App. Nach dem Neustart aktualisiert die App automatisch ihr Gateway auf die passende Version, startet es neu und überprüft anschließend die Verbindung.
- **Gateway aktualisieren** bedeutet, dass die App mit einem entfernten Gateway, einem manuell verwalteten lokalen Gateway oder einer anderen Installation verbunden ist, die nicht der App gehört. Die Schaltfläche führt den normalen Aktualisierungsablauf dieses Gateways aus, anstatt die Mac-App zu ändern.

Eine fehlgeschlagene koordinierte Aktualisierung verbleibt in ihrem einrichtungsähnlichen Fenster mit Aktionen zum erneuten Versuch, zum [Aktualisierungsleitfaden](/de/install/updating) und zu Discord. Die automatische Reparatur stuft ein neueres Gateway niemals zurück und überschreibt keine Kanalfixierung für `extended-stable`.

Nach einer erfolgreichen Aktualisierung sucht die App die zuletzt von einer Person verwendete direkte Sitzung der obersten Ebene und übermittelt diesem Agent einmalig ein Aktualisierungsereignis. Heartbeat- und Cron-Aktivitäten beeinflussen diese Auswahl nicht. Der Agent kann Sie dann in der Unterhaltung begrüßen, die Sie höchstwahrscheinlich verwendet haben. Im entfernten Modus aktualisiert die App nur die lokale Mac-Node-Laufzeit und überspringt die Benachrichtigung, wenn das entfernte Gateway älter als die App ist.

Sparkle folgt der Einstellung `update.channel` des Gateways. Mit `beta` und `dev` werden Beta-Builds der App aktiviert; `stable`, `extended-stable` sowie fehlende oder unbekannte Werte verwenden weiterhin stabile App-Builds.

## Dashboard-Links öffnen

Wenn Sie im eingebetteten Dashboard der macOS-App auf einen externen Weblink klicken, wird dieser in einer größenveränderbaren Browser-Seitenleiste mit halber Fensterbreite geöffnet, während die Dashboard-Navigation sichtbar bleibt. Ziehen Sie die Trennlinie, um eine andere Breite festzulegen; die App merkt sich diese. Jeder Link wird in einem eigenen Tab geöffnet. Die Tableiste wird angezeigt, sobald mehrere Seiten geöffnet sind, und ein erneuter Klick auf denselben Link verwendet dessen vorhandenen Tab. Ziehen Sie Tabs, um ihre Reihenfolge zu ändern, schließen Sie sie über die Tab-Schaltfläche zum Schließen oder mit einem Mittelklick und klicken Sie mit der rechten Maustaste auf einen Tab, um **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** oder **Close Other Tabs** auszuwählen. Mit den Zurück-/Vorwärts-Steuerelementen in der Titelleiste des Fensters und Wischgesten auf dem Trackpad navigieren Sie im Verlauf des Dashboards; mit den eigenen Zurück-/Vorwärts-Steuerelementen der Seitenleiste navigieren Sie im Verlauf des aktiven Tabs. Die Seitenleiste enthält außerdem Steuerelemente zum Neuladen, zum Öffnen im Standardbrowser und zum Schließen.

Die Steuerelemente der Titelleiste folgen der App-Seitenleiste: Solange sie ausgeklappt ist, befinden sich Zurück/Vorwärts an ihrem rechten Rand neben dem Umschalter für die Seitenleiste. Ist sie eingeklappt, machen sie Platz für eine Suchschaltfläche, die die Befehlspalette öffnet, und eine Schaltfläche für eine neue Sitzung.

Klicken Sie mit der rechten Maustaste auf einen externen Link, um **Open in Sidebar**, **Open in Default Browser** oder **Copy Link** auszuwählen. Modifizierte Klicks und vom Benutzer aktivierte Links des Dashboards, die ein neues Fenster öffnen, werden weiterhin im Standardbrowser geöffnet; Links innerhalb der Seitenleiste, die ein neues Fenster öffnen, werden als neue Seitenleisten-Tabs geöffnet. Regulär im Browser gehostete Seiten der Control UI behalten das normale Link- und Kontextmenüverhalten des Browsers bei.

## Browser-Anmeldungen importieren

Wenn die Browser-Seitenleiste erstmals geöffnet wird, während die App mit einem lokalen Gateway arbeitet, zeigt das Dashboard ein ausblendbares Banner an, sofern auf dem Mac ein Profil der Chrome-Familie mit Cookies vorhanden ist. Das Banner bietet an, diese Cookies in ein isoliertes, verwaltetes Profil zu kopieren, das Agenten zum Browsen verwenden. Wählen Sie über das Steuerelement **Import** ein Profil aus (Touch ID kann erforderlich sein); der Fortschritt und die Anzahl der importierten Cookies werden direkt angezeigt, und es werden ausschließlich Cookies kopiert – Passwörter verlassen niemals den Quellbrowser. Durch das Ausblenden des Banners wird die Entscheidung gespeichert; über **Einstellungen → Allgemein → Browser-Anmeldung → Importieren …** kann es jederzeit erneut aufgerufen werden. Informationen zum zugrunde liegenden Importablauf und zur Sperre `browser.allowSystemProfileImport` finden Sie unter [Browser](/de/cli/browser).

## Gateway-Modus auswählen

| Modus    | Verwenden, wenn                                                                | Detailseite                                        |
| -------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Lokal    | Dieser Mac soll das Gateway ausführen und mit launchd aktiv halten.            | [Gateway unter macOS](/de/platforms/mac/bundled-gateway) |
| Entfernt | Ein anderer Host führt das Gateway aus; dieser Mac steuert es über SSH, LAN oder Tailnet. | [Fernsteuerung](/de/platforms/mac/remote)            |

Beide Modi benötigen eine installierte `openclaw`-CLI, da die App deren Node-Host-Laufzeit wiederverwendet. Auf einem neuen Mac installiert die App automatisch die passende CLI. Anschließend startet der lokale Modus den Gateway-Assistenten, während der entfernte Modus eine Verbindung zum ausgewählten Gateway herstellt, ohne ein zweites lokales Gateway zu starten.
Informationen zur manuellen Wiederherstellung finden Sie unter [Gateway unter macOS](/de/platforms/mac/bundled-gateway).

## Zuständigkeiten der App

- Menüleistenstatus, Benachrichtigungen, Integritätsstatus, WebChat und die schwebende Quick-Chat-Leiste.
- macOS-Berechtigungsabfragen für Bildschirm, Mikrofon, Spracherkennung, Automatisierung und Bedienungshilfen.
- Eine Mac-Node, die natives Canvas, Kamera-/Bildschirmaufnahme, Benachrichtigungen, Standort und Computersteuerung mit den System-, Browser-, Plugin-, Skill- und MCP-Befehlen des CLI-Node-Hosts kombiniert.
- Abfragen zur Ausführungsgenehmigung für auf dem Mac gehostete Befehle.
- Ausführung genehmigter Shell-Befehle im App-Kontext, wobei die Zuordnung der macOS-Berechtigungen zur App erhalten bleibt, während die CLI-Laufzeit die gemeinsame Node-Richtlinie verwaltet.
- SSH-Tunnel oder direkte Gateway-Verbindungen im entfernten Modus.

In der eingebetteten Control UI zeigt **Einstellungen → Benachrichtigungen** anstelle von Browser-Push die native Benachrichtigungsberechtigung der App an, da die App Benachrichtigungen nativ zustellt.

Die App ersetzt **nicht** die allgemeine Dokumentation zum Gateway oder zur CLI. Die Konfiguration des Gateways sowie Provider, Plugins, Kanäle, Werkzeuge und Sicherheit werden in eigenen Dokumentationen behandelt.

## macOS-Detailseiten

| Aufgabe                                  | Weitere Informationen                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI-/Gateway-Dienst installieren oder debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway)                                   |
| Zustand außerhalb Cloud-synchronisierter Ordner halten | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#state-directory-on-macos)     |
| App-Erkennung und Konnektivität debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#debug-app-connectivity)                 |
| Verhalten von launchd verstehen          | [Gateway-Lebenszyklus](/de/platforms/mac/child-process)                                         |
| Berechtigungs- oder Signierungs-/TCC-Probleme beheben | [macOS-Berechtigungen](/de/platforms/mac/permissions)                              |
| Den zuletzt verwendeten Mac erkennen     | [Präsenz des aktiven Computers](/de/nodes/presence)                                             |
| Verbindung zu einem entfernten Gateway herstellen | [Fernsteuerung](/de/platforms/mac/remote)                                              |
| Menüleistenstatus und Integritätsprüfungen anzeigen | [Menüleiste](/de/platforms/mac/menu-bar), [Integritätsprüfungen](/de/platforms/mac/health) |
| Eingebettete Chat-Oberfläche verwenden   | [WebChat](/de/platforms/mac/webchat)                                                            |
| Sprachaktivierung oder Push-to-Talk verwenden | [Sprachaktivierung](/de/platforms/mac/voicewake)                                           |
| Canvas und Canvas-Deep-Links verwenden   | [Canvas](/de/platforms/mac/canvas)                                                              |
| PeekabooBridge für UI-Automatisierung hosten | [Peekaboo-Bridge](/de/platforms/mac/peekaboo)                                               |
| Befehlsfreigaben konfigurieren           | [Ausführungsfreigaben](/de/tools/exec-approvals), [erweiterte Details](/de/tools/exec-approvals-advanced) |
| Mac-Node-Befehle und App-IPC untersuchen | [macOS-IPC](/de/platforms/mac/xpc)                                                              |
| Protokolle erfassen                      | [macOS-Protokollierung](/de/platforms/mac/logging)                                              |
| Aus dem Quellcode erstellen              | [macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup)                                       |

## Verwandte Themen

- [Plattformen](/de/platforms)
- [Erste Schritte](/de/start/getting-started)
- [Gateway](/de/gateway)
- [Ausführungsfreigaben](/de/tools/exec-approvals)
