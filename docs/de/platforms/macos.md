---
read_when:
    - Installieren der macOS-App
    - Entscheidung zwischen lokalem und Remote-Gateway-Modus unter macOS
    - Suche nach Downloads der macOS-App-Version
summary: OpenClaw-Menüleisten-App für macOS installieren und verwenden
title: macOS-App
x-i18n:
    generated_at: "2026-07-04T06:27:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der OpenClaw-**Menüleistenbegleiter**. Verwenden Sie sie, wenn Sie eine
native Tray-UI, macOS-Berechtigungsabfragen, Benachrichtigungen, WebChat, Spracheingabe,
Canvas oder Mac-gehostete Node-Tools wie `system.run` wünschen.

Wenn Sie nur die CLI und den Gateway benötigen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).

## Download

Laden Sie macOS-App-Builds aus den
[OpenClaw-GitHub-Releases](https://github.com/openclaw/openclaw/releases) herunter.
Wenn ein Release macOS-App-Assets enthält, suchen Sie nach:

- `OpenClaw-<version>.dmg` (bevorzugt)
- `OpenClaw-<version>.zip`

Einige Releases enthalten nur CLI-, Nachweis- oder Windows-Assets. Wenn das neueste
Release kein macOS-App-Asset enthält, verwenden Sie das neueste Release, das eines enthält, oder bauen Sie die
App aus dem Quellcode mit der [macOS-Entwicklungseinrichtung](/de/platforms/mac/dev-setup).

## Erster Start

1. Installieren und starten Sie **OpenClaw.app**.
2. Wählen Sie **Dieser Mac** für einen lokalen Gateway aus, oder verbinden Sie sich mit einem Remote-Gateway.
3. Warten Sie im lokalen Modus, während die App ihre User-Space-Runtime und den Gateway installiert.
4. Schließen Sie die Provider-Einrichtung und die macOS-Berechtigungscheckliste ab.
5. Senden Sie die Onboarding-Testnachricht.

Für den CLI/Gateway-Einrichtungspfad verwenden Sie [Erste Schritte](/de/start/getting-started).
Für die Wiederherstellung von Berechtigungen verwenden Sie [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Gateway-Modus auswählen

| Modus  | Verwenden Sie ihn, wenn                                                                  | Detailseite                                        |
| ------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokal  | Dieser Mac den Gateway ausführen und mit launchd am Leben halten soll.                   | [Gateway auf macOS](/de/platforms/mac/bundled-gateway) |
| Remote | Ein anderer Host den Gateway ausführt und dieser Mac ihn über SSH, LAN oder Tailnet steuern soll. | [Remote-Steuerung](/de/platforms/mac/remote)          |

Der lokale Modus erfordert eine installierte `openclaw`-CLI. Auf einem frischen Mac installiert die App
die passende CLI und Runtime automatisch, bevor sie den Gateway-Assistenten startet.
Siehe [Gateway auf macOS](/de/platforms/mac/bundled-gateway) zur manuellen Wiederherstellung.

## Was die App verantwortet

- Menüleistenstatus, Benachrichtigungen, Integrität und WebChat.
- macOS-Berechtigungsabfragen für Bildschirm, Mikrofon, Spracherkennung, Automatisierung und Bedienungshilfen.
- Lokale Node-Tools wie Canvas, Kamera-/Bildschirmaufnahme, Benachrichtigungen und `system.run`.
- Exec-Genehmigungsabfragen für Mac-gehostete Befehle.
- SSH-Tunnel im Remote-Modus oder direkte Gateway-Verbindungen.

Die App ersetzt **nicht** den OpenClaw-Gateway oder die allgemeinen CLI-Dokumente. Die Kernkonfiguration des
Gateway, Provider, Plugins, Kanäle, Tools und Sicherheit befinden sich in
ihrer eigenen Dokumentation.

## macOS-Detailseiten

| Aufgabe                                  | Lesen                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| CLI/Gateway-Dienst installieren oder debuggen | [Gateway auf macOS](/de/platforms/mac/bundled-gateway)                                    |
| Zustand aus cloud-synchronisierten Ordnern heraushalten | [Gateway auf macOS](/de/platforms/mac/bundled-gateway#state-directory-on-macos)    |
| App-Erkennung und Konnektivität debuggen | [Gateway auf macOS](/de/platforms/mac/bundled-gateway#debug-app-connectivity)                 |
| launchd-Verhalten verstehen              | [Gateway-Lebenszyklus](/de/platforms/mac/child-process)                                       |
| Berechtigungen oder Signierungs-/TCC-Probleme beheben | [macOS-Berechtigungen](/de/platforms/mac/permissions)                              |
| Mit einem Remote-Gateway verbinden       | [Remote-Steuerung](/de/platforms/mac/remote)                                                  |
| Menüleistenstatus und Integritätsprüfungen lesen | [Menüleiste](/de/platforms/mac/menu-bar), [Integritätsprüfungen](/de/platforms/mac/health) |
| Die eingebettete Chat-UI verwenden       | [WebChat](/de/platforms/mac/webchat)                                                          |
| Voice Wake oder Push-to-Talk verwenden   | [Voice Wake](/de/platforms/mac/voicewake)                                                     |
| Canvas und Canvas-Deep-Links verwenden   | [Canvas](/de/platforms/mac/canvas)                                                            |
| PeekabooBridge für UI-Automatisierung hosten | [Peekaboo-Bridge](/de/platforms/mac/peekaboo)                                             |
| Befehlsfreigaben konfigurieren           | [Exec-Genehmigungen](/de/tools/exec-approvals), [erweiterte Details](/de/tools/exec-approvals-advanced) |
| Mac-Node-Befehle und App-IPC inspizieren | [macOS-IPC](/de/platforms/mac/xpc)                                                            |
| Logs erfassen                            | [macOS-Logging](/de/platforms/mac/logging)                                                    |
| Aus dem Quellcode bauen                  | [macOS-Entwicklungseinrichtung](/de/platforms/mac/dev-setup)                                  |

## Verwandt

- [Plattformen](/de/platforms)
- [Erste Schritte](/de/start/getting-started)
- [Gateway](/de/gateway)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
