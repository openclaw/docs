---
read_when:
    - macOS-App installieren
    - Entscheidung zwischen lokalem und Remote-Gateway-Modus unter macOS
    - Suche nach Downloads der macOS-App-Version
summary: OpenClaw-macOS-Menüleisten-App installieren und verwenden
title: macOS-App
x-i18n:
    generated_at: "2026-06-28T00:13:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der **Menüleisten-Begleiter** von OpenClaw. Verwenden Sie sie, wenn Sie eine
native Tray-Benutzeroberfläche, macOS-Berechtigungsaufforderungen, Benachrichtigungen, WebChat, Spracheingabe,
Canvas oder von einem Mac gehostete Node-Tools wie `system.run` benötigen.

Wenn Sie nur die CLI und den Gateway benötigen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).

## Download

Laden Sie Builds der macOS-App von den
[OpenClaw GitHub-Releases](https://github.com/openclaw/openclaw/releases) herunter.
Wenn ein Release Assets für die macOS-App enthält, suchen Sie nach:

- `OpenClaw-<version>.dmg` (bevorzugt)
- `OpenClaw-<version>.zip`

Einige Releases enthalten nur CLI-, Nachweis- oder Windows-Assets. Wenn das neueste
Release kein Asset für die macOS-App hat, verwenden Sie das neueste Release, das eines enthält, oder erstellen Sie die
App aus dem Quellcode mit [macOS-Entwicklungseinrichtung](/de/platforms/mac/dev-setup).

## Erster Start

1. Installieren und starten Sie **OpenClaw.app**.
2. Schließen Sie die macOS-Berechtigungscheckliste ab.
3. Wählen Sie den Modus **Lokal** oder **Remote**.
4. Installieren Sie die `openclaw`-CLI, wenn die App Sie dazu auffordert.
5. Öffnen Sie WebChat über die Menüleiste und senden Sie eine Testnachricht.

Für den Einrichtungsweg von CLI/Gateway verwenden Sie [Erste Schritte](/de/start/getting-started).
Für die Wiederherstellung von Berechtigungen verwenden Sie [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Gateway-Modus auswählen

| Modus  | Verwenden Sie ihn, wenn                                                                                  | Detailseite                                        |
| ------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokal  | Dieser Mac den Gateway ausführen und ihn mit launchd aktiv halten soll.                                  | [Gateway auf macOS](/de/platforms/mac/bundled-gateway) |
| Remote | Ein anderer Host den Gateway ausführt und dieser Mac ihn über SSH, LAN oder Tailnet steuern soll.        | [Remote-Steuerung](/de/platforms/mac/remote)          |

Der lokale Modus erfordert eine installierte `openclaw`-CLI. Die App kann sie installieren, oder Sie
können [Gateway auf macOS](/de/platforms/mac/bundled-gateway) folgen.

## Zuständigkeiten der App

- Status in der Menüleiste, Benachrichtigungen, Health und WebChat.
- macOS-Berechtigungsaufforderungen für Bildschirm, Mikrofon, Spracherkennung, Automation und Bedienungshilfen.
- Lokale Node-Tools wie Canvas, Kamera-/Bildschirmaufnahme, Benachrichtigungen und `system.run`.
- Exec-Genehmigungsaufforderungen für Mac-gehostete Befehle.
- SSH-Tunnel im Remote-Modus oder direkte Gateway-Verbindungen.

Die App ersetzt **nicht** die Dokumentation zum OpenClaw Gateway oder zur allgemeinen CLI. Zentrale
Gateway-Konfiguration, Provider, Plugins, Kanäle, Tools und Sicherheit befinden sich in
ihrer eigenen Dokumentation.

## macOS-Detailseiten

| Aufgabe                                  | Lesen                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| CLI-/Gateway-Dienst installieren oder debuggen | [Gateway auf macOS](/de/platforms/mac/bundled-gateway)                                    |
| Zustand aus Cloud-synchronisierten Ordnern heraushalten | [Gateway auf macOS](/de/platforms/mac/bundled-gateway#state-directory-on-macos)    |
| App-Erkennung und Konnektivität debuggen | [Gateway auf macOS](/de/platforms/mac/bundled-gateway#debug-app-connectivity)                 |
| launchd-Verhalten verstehen              | [Gateway-Lebenszyklus](/de/platforms/mac/child-process)                                       |
| Berechtigungen oder Signierungs-/TCC-Probleme beheben | [macOS-Berechtigungen](/de/platforms/mac/permissions)                              |
| Mit einem Remote-Gateway verbinden       | [Remote-Steuerung](/de/platforms/mac/remote)                                                  |
| Menüleistenstatus und Health Checks lesen | [Menüleiste](/de/platforms/mac/menu-bar), [Health Checks](/de/platforms/mac/health)             |
| Eingebettete Chat-Benutzeroberfläche verwenden | [WebChat](/de/platforms/mac/webchat)                                                     |
| Voice Wake oder Push-to-Talk verwenden   | [Voice Wake](/de/platforms/mac/voicewake)                                                     |
| Canvas und Canvas-Deep-Links verwenden   | [Canvas](/de/platforms/mac/canvas)                                                            |
| PeekabooBridge für UI-Automatisierung hosten | [Peekaboo Bridge](/de/platforms/mac/peekaboo)                                             |
| Befehlsfreigaben konfigurieren           | [Exec-Genehmigungen](/de/tools/exec-approvals), [erweiterte Details](/de/tools/exec-approvals-advanced) |
| Mac-Node-Befehle und App-IPC prüfen      | [macOS-IPC](/de/platforms/mac/xpc)                                                            |
| Logs erfassen                            | [macOS-Logging](/de/platforms/mac/logging)                                                    |
| Aus dem Quellcode erstellen              | [macOS-Entwicklungseinrichtung](/de/platforms/mac/dev-setup)                                  |

## Verwandt

- [Plattformen](/de/platforms)
- [Erste Schritte](/de/start/getting-started)
- [Gateway](/de/gateway)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
