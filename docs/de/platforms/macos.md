---
read_when:
    - Installieren der macOS-App
    - Entscheidung zwischen lokalem und entferntem Gateway-Modus unter macOS
    - Downloads für macOS-App-Releases suchen
summary: Installieren und verwenden Sie die OpenClaw-Menüleisten-App für macOS
title: macOS-App
x-i18n:
    generated_at: "2026-07-12T15:39:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der OpenClaw-**Menüleistenbegleiter**: native Statusleistenoberfläche, macOS-Berechtigungsabfragen, Benachrichtigungen, WebChat, Spracheingabe, Canvas und
auf dem Mac gehostete Node-Werkzeuge wie `system.run`.

Benötigen Sie nur die CLI und das Gateway? Beginnen Sie mit [Erste Schritte](/de/start/getting-started).

## Download

Laden Sie Builds der macOS-App von den [OpenClaw-GitHub-Releases](https://github.com/openclaw/openclaw/releases) herunter.
Wenn ein Release Assets für die macOS-App enthält, suchen Sie nach:

- `OpenClaw-<version>.dmg` (bevorzugt)
- `OpenClaw-<version>.zip`

Einige Releases enthalten nur CLI-, Nachweis- oder Windows-Assets. Wenn das neueste Release
kein Asset für die macOS-App enthält, verwenden Sie das neueste Release mit einem solchen Asset oder erstellen Sie die App aus dem Quellcode mithilfe der
[macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup).

## Erster Start

1. Installieren und starten Sie **OpenClaw.app**.
2. Wählen Sie **This Mac** für ein lokales Gateway oder stellen Sie eine Verbindung zu einem entfernten Gateway her.
3. Lokaler Modus: Warten Sie, während die App ihre Laufzeitumgebung im Benutzerbereich und das Gateway installiert.
4. Stellen Sie die Inferenz mit einer Live-Modellprüfung her. Nach erfolgreicher Prüfung übernimmt Crestodian
   die verbleibende Einrichtung.
5. Vervollständigen Sie die Checkliste für macOS-Berechtigungen und senden Sie die Testnachricht für das Onboarding.

Wenn die App ein vorhandenes Gateway erreicht, dessen Standard-Agent über ein konfiguriertes
Modell verfügt, betrachtet sie dieses Gateway als bereits eingerichtet, überspringt das Provider-Onboarding und
Crestodian und öffnet das Dashboard. Wenn die Verbindung zum Gateway nicht hergestellt werden kann oder dessen
Standard-Agent kein Modell besitzt, bleibt das Inferenz-Onboarding zur
Wiederherstellung verfügbar.

Verwenden Sie für die Einrichtung von CLI und Gateway [Erste Schritte](/de/start/getting-started).
Verwenden Sie zur Wiederherstellung von Berechtigungen [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Updates

Die Update-Karte im Dashboard aktualisiert zuerst die signierte macOS-App über Sparkle.
Nach dem Neustart der App aktualisiert und startet sie automatisch das passende,
von der App verwaltete lokale Gateway neu. Homebrew- und andere vom Benutzer verwaltete CLI-Installationen verwenden weiterhin
den normalen Update-Ablauf des Gateways (die Karte führt das Gateway-Update direkt aus),
und die automatische Reparatur führt niemals ein Downgrade eines neueren Gateways durch oder überschreibt eine
`extended-stable`-Kanalfixierung.

Sparkle folgt der Einstellung `update.channel` des Gateways. `beta` und `dev` aktivieren
Beta-Builds der App; `stable`, `extended-stable` sowie fehlende oder unbekannte Werte
verwenden stabile App-Builds.

## Dashboard-Links öffnen

Wenn Sie im eingebetteten Dashboard der macOS-App auf einen externen Weblink klicken, wird dieser in einer größenveränderbaren Browser-Seitenleiste geöffnet. Jeder Link wird in einem eigenen Tab geöffnet; ein erneuter Klick auf denselben Link verwendet den vorhandenen Tab wieder. Ziehen Sie Tabs, um ihre Reihenfolge zu ändern, schließen Sie sie über die Schaltfläche zum Schließen des Tabs oder mit einem Mittelklick, und klicken Sie mit der rechten Maustaste auf einen Tab, um **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** oder **Close Other Tabs** auszuwählen. Mit den Zurück-/Vorwärts-Steuerelementen in der Titelleiste des Fensters und Wischgesten auf dem Trackpad navigieren Sie durch den Verlauf des Dashboards; mit den eigenen Zurück-/Vorwärts-Steuerelementen der Seitenleiste navigieren Sie durch den Verlauf des aktiven Tabs. Die Seitenleiste verfügt außerdem über Steuerelemente zum Neuladen, Öffnen im Standardbrowser und Schließen und merkt sich ihre Breite.

Die Steuerelemente in der Titelleiste richten sich nach der App-Seitenleiste: Wenn sie ausgeklappt ist, befinden sich Zurück/Vorwärts an ihrem rechten Rand neben dem Umschalter für die Seitenleiste; wenn sie eingeklappt ist, machen sie Platz für eine Suchschaltfläche (öffnet die Befehlspalette) und eine Schaltfläche für eine neue Sitzung.

Klicken Sie mit der rechten Maustaste auf einen externen Link, um **Open in Sidebar**, **Open in Default Browser** oder **Copy Link** auszuwählen. Modifizierte Klicks und vom Benutzer aktivierte Links für neue Fenster aus dem Dashboard werden weiterhin im Standardbrowser geöffnet; Links für neue Fenster innerhalb der Seitenleiste werden als neue Seitenleisten-Tabs geöffnet. Reguläre, im Browser gehostete Seiten der Control UI behalten das normale Link- und Kontextmenüverhalten des Browsers bei.

## Browser-Anmeldungen importieren

Wenn die App mit einem lokalen Gateway ausgeführt wird und auf dem Mac ein Profil eines Browsers der Chrome-Familie mit Cookies vorhanden ist, zeigt das Dashboard-Fenster ein ausblendbares Banner an, das anbietet, diese Cookies in ein isoliertes, verwaltetes Profil zu kopieren, das Agenten zum Browsen verwenden. Wählen Sie über das Steuerelement **Import** des Banners ein Profil aus (möglicherweise ist Touch ID erforderlich); der Fortschritt und die Anzahl der importierten Cookies werden direkt angezeigt, und es werden ausschließlich Cookies kopiert — Passwörter verlassen niemals den Quellbrowser. Wenn Sie das Banner ausblenden, wird diese Auswahl gespeichert; über **Settings → General → Browser login → Import…** können Sie das Angebot jederzeit erneut aufrufen. Informationen zum zugrunde liegenden Importablauf und zur Beschränkung `browser.allowSystemProfileImport` finden Sie unter [Browser](/de/cli/browser).

## Gateway-Modus auswählen

| Modus    | Verwenden Sie ihn, wenn                                                         | Detailseite                                        |
| -------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokal    | Dieser Mac soll das Gateway ausführen und mit launchd aktiv halten.             | [Gateway unter macOS](/de/platforms/mac/bundled-gateway) |
| Entfernt | Ein anderer Host führt das Gateway aus; dieser Mac steuert es über SSH, LAN oder Tailnet. | [Fernsteuerung](/de/platforms/mac/remote)            |

Der lokale Modus benötigt eine installierte `openclaw`-CLI. Auf einem neuen Mac installiert die App
automatisch die passende CLI und Laufzeitumgebung, bevor sie den Gateway-Assistenten startet.
Informationen zur manuellen Wiederherstellung finden Sie unter [Gateway unter macOS](/de/platforms/mac/bundled-gateway).

## Wofür die App zuständig ist

- Status in der Menüleiste, Benachrichtigungen, Systemzustand und WebChat.
- macOS-Berechtigungsabfragen für Bildschirm, Mikrofon, Spracherkennung, Automatisierung und Bedienungshilfen.
- Lokale Node-Werkzeuge: Canvas, Kamera-/Bildschirmaufnahme, Benachrichtigungen und `system.run`.
- Abfragen zur Ausführungsgenehmigung für auf dem Mac gehostete Befehle.
- SSH-Tunnel im entfernten Modus oder direkte Gateway-Verbindungen.

Die App ersetzt **nicht** die allgemeine Dokumentation zum Gateway oder zur CLI. Gateway-
Konfiguration, Provider, Plugins, Kanäle, Werkzeuge und Sicherheit werden in eigenen
Dokumentationen behandelt.

## macOS-Detailseiten

| Aufgabe                                  | Weitere Informationen                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| CLI-/Gateway-Dienst installieren oder debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway)                                    |
| Zustand aus Cloud-synchronisierten Ordnern heraushalten | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#state-directory-on-macos)      |
| App-Erkennung und Konnektivität debuggen | [Gateway unter macOS](/de/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Verhalten von launchd verstehen          | [Gateway-Lebenszyklus](/de/platforms/mac/child-process)                                           |
| Berechtigungs- oder Signierungs-/TCC-Probleme beheben | [macOS-Berechtigungen](/de/platforms/mac/permissions)                              |
| Den zuletzt verwendeten Mac erkennen     | [Präsenz des aktiven Computers](/nodes/presence)                                               |
| Verbindung zu einem entfernten Gateway herstellen | [Fernsteuerung](/de/platforms/mac/remote)                                                |
| Status der Menüleiste und Zustandsprüfungen anzeigen | [Menüleiste](/de/platforms/mac/menu-bar), [Zustandsprüfungen](/de/platforms/mac/health) |
| Eingebettete Chat-Oberfläche verwenden   | [WebChat](/de/platforms/mac/webchat)                                                              |
| Sprachaktivierung oder Push-to-Talk verwenden | [Sprachaktivierung](/de/platforms/mac/voicewake)                                             |
| Canvas und Canvas-Deep-Links verwenden   | [Canvas](/de/platforms/mac/canvas)                                                                |
| PeekabooBridge für UI-Automatisierung hosten | [Peekaboo-Bridge](/de/platforms/mac/peekaboo)                                                |
| Befehlsfreigaben konfigurieren           | [Ausführungsfreigaben](/de/tools/exec-approvals), [erweiterte Details](/de/tools/exec-approvals-advanced) |
| Mac-Node-Befehle und App-IPC untersuchen | [macOS-IPC](/de/platforms/mac/xpc)                                                                |
| Protokolle erfassen                      | [macOS-Protokollierung](/de/platforms/mac/logging)                                                |
| Aus dem Quellcode erstellen              | [macOS-Entwicklungsumgebung](/de/platforms/mac/dev-setup)                                         |

## Verwandte Themen

- [Plattformen](/de/platforms)
- [Erste Schritte](/de/start/getting-started)
- [Gateway](/de/gateway)
- [Ausführungsfreigaben](/de/tools/exec-approvals)
