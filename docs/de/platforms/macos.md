---
read_when:
    - Installieren der macOS-App
    - Entscheidung zwischen lokalem und entferntem Gateway-Modus unter macOS
    - Suchen Sie nach Downloads für macOS-App-Releases
summary: Installieren und verwenden Sie die OpenClaw-Menüleisten-App für macOS
title: macOS-App
x-i18n:
    generated_at: "2026-07-12T21:40:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef3ea75aa2f158829da643ca016681e40102cc4fad84e207e80b377d023c2e1f
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der **Menüleisten-Begleiter** von OpenClaw: native Menüleistenoberfläche, macOS-Berechtigungsabfragen, Benachrichtigungen, WebChat, Spracheingabe, Canvas und auf dem Mac gehostete Node-Tools wie `system.run`.

Benötigen Sie nur die CLI und das Gateway? Beginnen Sie mit [Erste Schritte](/de/start/getting-started).

## Download

Laden Sie Builds der macOS-App von den [OpenClaw-Releases auf GitHub](https://github.com/openclaw/openclaw/releases) herunter.
Wenn ein Release Assets für die macOS-App enthält, suchen Sie nach:

- `OpenClaw-<version>.dmg` (bevorzugt)
- `OpenClaw-<version>.zip`

Einige Releases enthalten nur CLI-, Nachweis- oder Windows-Assets. Wenn das neueste Release kein Asset für die macOS-App enthält, verwenden Sie das neueste Release mit einem solchen Asset oder erstellen Sie die App anhand der [macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup) aus dem Quellcode.

## Erster Start

1. Installieren und starten Sie **OpenClaw.app**.
2. Wählen Sie **Dieser Mac** für ein lokales Gateway aus oder stellen Sie eine Verbindung zu einem entfernten Gateway her.
3. Warten Sie, während die App die passende CLI-Laufzeit installiert. Im lokalen Modus installiert und startet sie außerdem das Gateway.
4. Stellen Sie die Inferenz mit einer Live-Modellprüfung her. Nach erfolgreicher Prüfung übernimmt Crestodian die verbleibende Einrichtung.
5. Schließen Sie die Checkliste für macOS-Berechtigungen ab und senden Sie die Testnachricht für das Onboarding.

Wenn die App ein vorhandenes Gateway erreicht, dessen Standard-Agent über ein konfiguriertes Modell verfügt, betrachtet sie dieses Gateway als bereits eingerichtet, überspringt das Provider-Onboarding und Crestodian und öffnet das Dashboard. Wenn keine Verbindung zum Gateway hergestellt werden kann oder dessen Standard-Agent kein Modell besitzt, bleibt das Inferenz-Onboarding zur Wiederherstellung verfügbar.

Verwenden Sie für die Einrichtung von CLI und Gateway [Erste Schritte](/de/start/getting-started).
Informationen zur Wiederherstellung von Berechtigungen finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Updates

Die Update-Karte im Dashboard aktualisiert zuerst die signierte macOS-App über Sparkle.
Nach dem Neustart der App aktualisiert und startet sie automatisch das passende, von der App verwaltete lokale Gateway neu. Bei Homebrew und anderen benutzerverwalteten CLI-Installationen bleibt der normale Update-Ablauf des Gateways erhalten (die Karte führt das Gateway-Update direkt aus), und die automatische Reparatur führt niemals ein Downgrade eines neueren Gateways durch oder überschreibt eine Festlegung auf den Kanal `extended-stable`.

Sparkle folgt der Einstellung `update.channel` des Gateways. `beta` und `dev` aktivieren Beta-Builds der App; bei `stable`, `extended-stable` sowie fehlenden oder unbekannten Werten werden stabile App-Builds verwendet.

## Dashboard-Links öffnen

Wenn Sie im eingebetteten Dashboard der macOS-App auf einen externen Weblink klicken, wird er in einer größenveränderbaren Browser-Seitenleiste geöffnet. Jeder Link wird in einem eigenen Tab geöffnet; wenn Sie denselben Link erneut anklicken, wird der vorhandene Tab wiederverwendet. Ziehen Sie Tabs, um ihre Reihenfolge zu ändern, schließen Sie sie über die Schließen-Schaltfläche des Tabs oder per Mittelklick und klicken Sie mit der rechten Maustaste auf einen Tab, um **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** oder **Close Other Tabs** auszuwählen. Mit den Zurück-/Vorwärts-Steuerelementen in der Titelleiste des Fensters und Wischgesten auf dem Trackpad navigieren Sie durch den Verlauf des Dashboards; mit den eigenen Zurück-/Vorwärts-Steuerelementen der Seitenleiste navigieren Sie durch den Verlauf des aktiven Tabs. Die Seitenleiste verfügt außerdem über Steuerelemente zum Neuladen, Öffnen im Standardbrowser und Schließen und merkt sich ihre Breite.

Die Steuerelemente der Titelleiste richten sich nach der App-Seitenleiste: Wenn sie ausgeklappt ist, befinden sich Zurück/Vorwärts an ihrem rechten Rand neben dem Umschalter für die Seitenleiste; wenn sie eingeklappt ist, machen sie Platz für eine Suchschaltfläche (öffnet die Befehlspalette) und eine Schaltfläche für eine neue Sitzung.

Klicken Sie mit der rechten Maustaste auf einen externen Link, um **Open in Sidebar**, **Open in Default Browser** oder **Copy Link** auszuwählen. Modifizierte Klicks und vom Benutzer aktivierte Links zu neuen Fenstern aus dem Dashboard werden weiterhin im Standardbrowser geöffnet; Links zu neuen Fenstern innerhalb der Seitenleiste werden als neue Seitenleisten-Tabs geöffnet. Reguläre, im Browser gehostete Seiten der Control UI behalten das normale Link- und Kontextmenüverhalten des Browsers bei.

## Browser-Anmeldungen importieren

Wenn die App mit einem lokalen Gateway ausgeführt wird und auf dem Mac ein Profil eines Chrome-basierten Browsers mit Cookies vorhanden ist, zeigt das Dashboard-Fenster ein ausblendbares Banner an, das anbietet, diese Cookies in ein isoliertes, verwaltetes Profil zu kopieren, das Agenten zum Browsen verwenden. Wählen Sie über das Steuerelement **Import** im Banner ein Profil aus (möglicherweise ist Touch ID erforderlich); der Fortschritt und die Anzahl der importierten Cookies werden direkt im Banner angezeigt, und es werden ausschließlich Cookies kopiert – Passwörter verlassen niemals den Quellbrowser. Wenn Sie das Banner ausblenden, wird diese Auswahl gespeichert; über **Settings → General → Browser login → Import…** können Sie das Angebot jederzeit erneut aufrufen. Weitere Informationen zum zugrunde liegenden Importablauf und zur Sperre `browser.allowSystemProfileImport` finden Sie unter [Browser](/de/cli/browser).

## Gateway-Modus auswählen

| Modus    | Verwenden Sie ihn, wenn                                                       | Detailseite                                         |
| -------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| Lokal    | Dieser Mac soll das Gateway ausführen und mit launchd aktiv halten.           | [Gateway unter macOS](/de/platforms/mac/bundled-gateway) |
| Entfernt | Ein anderer Host führt das Gateway aus; dieser Mac steuert es über SSH, LAN oder Tailnet. | [Fernsteuerung](/de/platforms/mac/remote)               |

Für beide Modi muss eine `openclaw`-CLI installiert sein, da die App deren Node-Host-Laufzeit wiederverwendet. Auf einem neuen Mac installiert die App automatisch die passende CLI; im lokalen Modus startet sie anschließend den Gateway-Assistenten, während sie im entfernten Modus eine Verbindung zum ausgewählten Gateway herstellt, ohne ein zweites lokales Gateway zu starten.
Informationen zur manuellen Wiederherstellung finden Sie unter [Gateway unter macOS](/de/platforms/mac/bundled-gateway).

## Wofür die App zuständig ist

- Menüleistenstatus, Benachrichtigungen, Funktionszustand und WebChat.
- macOS-Berechtigungsabfragen für Bildschirm, Mikrofon, Spracherkennung, Automatisierung und Bedienungshilfen.
- Eine Mac-Node, die natives Canvas, Kamera-/Bildschirmaufnahme, Benachrichtigungen, Standort und Computersteuerung mit den System-, Browser-, Plugin-, Skill- und MCP-Befehlen des CLI-Node-Hosts kombiniert.
- Abfragen zur Ausführungsgenehmigung für auf dem Mac gehostete Befehle.
- Ausführung genehmigter Shell-Befehle im App-Kontext, wobei die Zuordnung der macOS-Berechtigungen zur App erhalten bleibt, während die CLI-Laufzeit für die gemeinsame Node-Richtlinie zuständig ist.
- SSH-Tunnel im entfernten Modus oder direkte Gateway-Verbindungen.

Die App ersetzt **nicht** die allgemeine Dokumentation zum Gateway oder zur CLI. Gateway-Konfiguration, Provider, Plugins, Kanäle, Tools und Sicherheit werden in ihren jeweiligen Dokumentationen behandelt.

## macOS-Detailseiten

| Aufgabe                                  | Weitere Informationen                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| CLI-/Gateway-Dienst installieren oder debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway)                                      |
| Zustand aus cloud-synchronisierten Ordnern heraushalten | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| App-Erkennung und Konnektivität debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#debug-app-connectivity)                    |
| Verhalten von launchd verstehen          | [Gateway-Lebenszyklus](/de/platforms/mac/child-process)                                            |
| Berechtigungs- oder Signierungs-/TCC-Probleme beheben | [macOS-Berechtigungen](/de/platforms/mac/permissions)                                  |
| Den zuletzt verwendeten Mac erkennen     | [Präsenz des aktiven Computers](/de/nodes/presence)                                                |
| Mit einem entfernten Gateway verbinden   | [Fernsteuerung](/de/platforms/mac/remote)                                                          |
| Menüleistenstatus und Funktionsprüfungen anzeigen | [Menüleiste](/de/platforms/mac/menu-bar), [Funktionsprüfungen](/de/platforms/mac/health)      |
| Eingebettete Chat-Oberfläche verwenden   | [WebChat](/de/platforms/mac/webchat)                                                               |
| Sprachaktivierung oder Push-to-Talk verwenden | [Sprachaktivierung](/de/platforms/mac/voicewake)                                             |
| Canvas und Canvas-Deep-Links verwenden   | [Canvas](/de/platforms/mac/canvas)                                                                 |
| PeekabooBridge für UI-Automatisierung hosten | [Peekaboo-Bridge](/de/platforms/mac/peekaboo)                                                 |
| Befehlsfreigaben konfigurieren           | [Ausführungsgenehmigungen](/de/tools/exec-approvals), [erweiterte Details](/de/tools/exec-approvals-advanced) |
| Mac-Node-Befehle und App-IPC untersuchen | [macOS-IPC](/de/platforms/mac/xpc)                                                                 |
| Protokolle erfassen                      | [macOS-Protokollierung](/de/platforms/mac/logging)                                                 |
| Aus dem Quellcode erstellen              | [macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup)                                          |

## Verwandte Themen

- [Plattformen](/de/platforms)
- [Erste Schritte](/de/start/getting-started)
- [Gateway](/de/gateway)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
