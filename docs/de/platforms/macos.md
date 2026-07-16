---
read_when:
    - Installation der macOS-App
    - Entscheidung zwischen lokalem und entferntem Gateway-Modus unter macOS
    - Auf der Suche nach Downloads für macOS-App-Releases
summary: OpenClaw-Menüleisten-App für macOS installieren und verwenden
title: macOS-App
x-i18n:
    generated_at: "2026-07-16T13:04:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist die **Menüleisten-Begleit-App** von OpenClaw: native Statusleisten-Benutzeroberfläche, macOS-Berechtigungsabfragen, Benachrichtigungen, WebChat, Spracheingabe, Canvas und
auf dem Mac gehostete Node-Tools wie `system.run`.

Benötigen Sie nur die CLI und das Gateway? Beginnen Sie mit [Erste Schritte](/de/start/getting-started).

## Download

Laden Sie Builds der macOS-App aus den [OpenClaw-GitHub-Releases](https://github.com/openclaw/openclaw/releases) herunter.
Wenn ein Release Assets für die macOS-App enthält, suchen Sie nach:

- `OpenClaw-<version>.dmg` (bevorzugt)
- `OpenClaw-<version>.zip`

Einige Releases enthalten nur CLI-, Nachweis- oder Windows-Assets. Wenn das neueste Release
kein Asset für die macOS-App enthält, verwenden Sie das neueste Release mit einem solchen Asset oder erstellen Sie die App mithilfe der
[macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup) aus dem Quellcode.

## Erster Start

1. Installieren und starten Sie **OpenClaw.app**.
2. Wählen Sie **This Mac** für ein lokales Gateway oder stellen Sie eine Verbindung zu einem entfernten Gateway her.
3. Warten Sie, während die App die passende CLI-Laufzeit installiert. Im lokalen Modus installiert und startet sie außerdem
   das Gateway.
4. Stellen Sie die Inferenz mit einer Live-Modellprüfung her. Nach erfolgreicher Prüfung übernimmt OpenClaw
   die verbleibende Einrichtung.
5. Schließen Sie die Checkliste für macOS-Berechtigungen ab und senden Sie die Onboarding-Testnachricht.

Wenn die App ein bestehendes Gateway erreicht, dessen Standard-Agent über ein konfiguriertes
Modell verfügt, behandelt sie dieses Gateway als bereits eingerichtet, überspringt das Provider-Onboarding und
OpenClaw und öffnet das Dashboard. Wenn keine Verbindung zum Gateway hergestellt werden kann oder sein
Standard-Agent kein Modell hat, bleibt das Inferenz-Onboarding zur
Wiederherstellung verfügbar.

Verwenden Sie für die Einrichtung von CLI und Gateway [Erste Schritte](/de/start/getting-started).
Verwenden Sie zur Wiederherstellung von Berechtigungen [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Updates

Die Update-Karte des Dashboards gibt an, was die App aktualisiert:

- **Mac-App + Gateway aktualisieren** bedeutet, dass die signierte App Eigentümerin des lokalen, von launchd verwalteten
  Gateways ist. Sparkle aktualisiert zuerst die App. Nach dem Neustart aktualisiert die App automatisch
  ihr Gateway auf die passende Version, startet es neu und überprüft anschließend die
  Verbindung.
- **Gateway aktualisieren** bedeutet, dass die App mit einem entfernten Gateway, einem manuell
  verwalteten lokalen Gateway oder einer anderen Installation verbunden ist, die nicht der App gehört. Die Schaltfläche
  führt den normalen Update-Ablauf dieses Gateways aus, statt die Mac-App zu ändern.

Ein fehlgeschlagenes koordiniertes Update bleibt in seinem einrichtungsähnlichen Fenster mit Optionen zum erneuten Versuch,
zum [Update-Leitfaden](/de/install/updating) und zu Discord-Aktionen. Die automatische Reparatur führt niemals
ein Downgrade eines neueren Gateways durch und überschreibt keine `extended-stable`-Kanalfixierung.

Nach einem erfolgreichen Update ermittelt die App die zuletzt von einem Menschen verwendete,
direkte Sitzung der obersten Ebene und sendet diesem Agent einmalig ein Update-Ereignis. Heartbeat-
und Cron-Aktivitäten beeinflussen diese Auswahl nicht. Der Agent kann Sie dann in der Unterhaltung wieder begrüßen,
die Sie höchstwahrscheinlich verwendet haben. Im Remote-Modus
aktualisiert die App nur die lokale Mac-Node-Laufzeit und überspringt die Benachrichtigung, wenn das
entfernte Gateway älter als die App ist.

Sparkle folgt der `update.channel`-Einstellung des Gateways. `beta` und `dev` aktivieren
Beta-Builds der App; `stable`, `extended-stable` sowie fehlende oder unbekannte Werte
verwenden weiterhin stabile App-Builds.

## Dashboard-Links öffnen

Wenn Sie im eingebetteten Dashboard der macOS-App auf einen externen Weblink klicken, wird dieser in einer größenveränderbaren Browser-Seitenleiste mit halber Fensterbreite geöffnet, während die Dashboard-Navigation sichtbar bleibt. Ziehen Sie die Trennlinie, um eine andere Breite festzulegen; die App merkt sich diese. Jeder Link wird in einem eigenen Tab geöffnet, die Tableiste erscheint, sobald mehrere Seiten geöffnet sind, und ein erneuter Klick auf denselben Link verwendet dessen bestehenden Tab. Ziehen Sie Tabs, um sie neu anzuordnen, schließen Sie sie über die Schließen-Schaltfläche des Tabs oder per Mittelklick und klicken Sie mit der rechten Maustaste auf einen Tab, um **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** oder **Close Other Tabs** auszuwählen. Mit den Zurück-/Vorwärts-Steuerelementen in der Titelleiste des Fensters und Wischgesten auf dem Trackpad navigieren Sie durch den Verlauf des Dashboards; mit den eigenen Zurück-/Vorwärts-Steuerelementen der Seitenleiste navigieren Sie durch den Verlauf des aktiven Tabs. Die Seitenleiste verfügt außerdem über Steuerelemente zum Neuladen, zum Öffnen im Standardbrowser und zum Schließen.

Die Steuerelemente der Titelleiste folgen der App-Seitenleiste: Wenn sie ausgeklappt ist, befinden sich Zurück/Vorwärts an ihrem rechten Rand neben dem Seitenleisten-Umschalter; wenn sie eingeklappt ist, machen sie Platz für eine Suchschaltfläche (öffnet die Befehlspalette) und eine Schaltfläche für eine neue Sitzung.

Klicken Sie mit der rechten Maustaste auf einen externen Link, um **Open in Sidebar**, **Open in Default Browser** oder **Copy Link** auszuwählen. Modifizierte Klicks und vom Benutzer aktivierte Links zu neuen Fenstern aus dem Dashboard werden weiterhin im Standardbrowser geöffnet; Links zu neuen Fenstern innerhalb der Seitenleiste werden als neue Seitenleisten-Tabs geöffnet. Reguläre, im Browser gehostete Seiten der Control UI behalten das normale Link- und Kontextmenüverhalten des Browsers bei.

## Browser-Anmeldungen importieren

Wenn die Browser-Seitenleiste erstmals geöffnet wird, während die App mit einem lokalen Gateway arbeitet, zeigt das Dashboard ein ausblendbares Banner an, sofern auf dem Mac ein Profil der Chrome-Familie mit Cookies vorhanden ist. Das Banner bietet an, diese Cookies in ein isoliertes, verwaltetes Profil zu kopieren, das Agenten zum Browsen verwenden. Wählen Sie über das Steuerelement **Import** ein Profil aus (möglicherweise ist Touch ID erforderlich); der Fortschritt und die Anzahl der importierten Cookies werden direkt angezeigt, und es werden ausschließlich Cookies kopiert – Passwörter verlassen niemals den Quellbrowser. Beim Ausblenden des Banners wird diese Auswahl gespeichert; über **Settings → General → Browser login → Import…** können Sie es jederzeit erneut anzeigen. Informationen zum zugrunde liegenden Importablauf und zur `browser.allowSystemProfileImport`-Sperre finden Sie unter [Browser](/de/cli/browser).

## Gateway-Modus auswählen

| Modus   | Verwenden, wenn                                                                 | Detailseite                                        |
| ------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokal   | Dieser Mac soll das Gateway ausführen und mit launchd aktiv halten.             | [Gateway unter macOS](/de/platforms/mac/bundled-gateway) |
| Remote  | Ein anderer Host führt das Gateway aus; dieser Mac steuert es über SSH, LAN oder Tailnet. | [Fernsteuerung](/de/platforms/mac/remote)            |

Beide Modi benötigen eine installierte `openclaw`-CLI, da die App deren Node-Host-
Laufzeit wiederverwendet. Auf einem neuen Mac installiert die App automatisch die passende CLI; im lokalen
Modus startet sie anschließend den Gateway-Assistenten, während sie im Remote-Modus eine Verbindung zum ausgewählten
Gateway herstellt, ohne ein zweites lokales Gateway zu starten.
Informationen zur manuellen Wiederherstellung finden Sie unter [Gateway unter macOS](/de/platforms/mac/bundled-gateway).

## Zuständigkeitsbereich der App

- Menüleistenstatus, Benachrichtigungen, Systemzustand und WebChat.
- macOS-Berechtigungsabfragen für Bildschirm, Mikrofon, Spracherkennung, Automatisierung und Bedienungshilfen.
- Eine Mac-Node, die natives Canvas, Kamera-/Bildschirmaufnahme, Benachrichtigungen,
  Standort und Computersteuerung mit den System-, Browser-, Plugin-, Skill-
  und MCP-Befehlen des CLI-Node-Hosts kombiniert.
- Ausführungsfreigabe-Abfragen für auf dem Mac gehostete Befehle.
- Ausführung im App-Kontext für genehmigte Shell-Befehle, wobei die macOS-
  Berechtigungszuordnung der App erhalten bleibt, während die CLI-Laufzeit die gemeinsame Node-Richtlinie verwaltet.
- SSH-Tunnel im Remote-Modus oder direkte Gateway-Verbindungen.

Die App ersetzt **nicht** die allgemeine Dokumentation zum Gateway oder zur CLI. Gateway-
Konfiguration, Provider, Plugins, Kanäle, Tools und Sicherheit werden in ihren
jeweiligen Dokumentationen behandelt.

## macOS-Detailseiten

| Aufgabe                                  | Weitere Informationen                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| CLI-/Gateway-Dienst installieren oder debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway)                                     |
| Zustand aus Cloud-synchronisierten Ordnern heraushalten | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| App-Erkennung und Verbindung debuggen    | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#debug-app-connectivity)                  |
| Verhalten von launchd verstehen          | [Gateway-Lebenszyklus](/de/platforms/mac/child-process)                                           |
| Berechtigungs- oder Signierungs-/TCC-Probleme beheben | [macOS-Berechtigungen](/de/platforms/mac/permissions)                                |
| Den zuletzt verwendeten Mac erkennen     | [Präsenz des aktiven Computers](/de/nodes/presence)                                               |
| Verbindung zu einem entfernten Gateway herstellen | [Fernsteuerung](/de/platforms/mac/remote)                                               |
| Menüleistenstatus und Zustandsprüfungen anzeigen | [Menüleiste](/de/platforms/mac/menu-bar), [Zustandsprüfungen](/de/platforms/mac/health)       |
| Eingebettete Chat-Benutzeroberfläche verwenden | [WebChat](/de/platforms/mac/webchat)                                                       |
| Sprachaktivierung oder Push-to-Talk verwenden | [Sprachaktivierung](/de/platforms/mac/voicewake)                                           |
| Canvas und Canvas-Deep-Links verwenden   | [Canvas](/de/platforms/mac/canvas)                                                               |
| PeekabooBridge für UI-Automatisierung hosten | [Peekaboo-Bridge](/de/platforms/mac/peekaboo)                                               |
| Befehlsfreigaben konfigurieren           | [Ausführungsfreigaben](/de/tools/exec-approvals), [erweiterte Details](/de/tools/exec-approvals-advanced) |
| Mac-Node-Befehle und App-IPC untersuchen | [macOS-IPC](/de/platforms/mac/xpc)                                                               |
| Protokolle erfassen                      | [macOS-Protokollierung](/de/platforms/mac/logging)                                                |
| Aus dem Quellcode erstellen              | [macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup)                                         |

## Verwandte Themen

- [Plattformen](/de/platforms)
- [Erste Schritte](/de/start/getting-started)
- [Gateway](/de/gateway)
- [Ausführungsfreigaben](/de/tools/exec-approvals)
