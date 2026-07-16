---
read_when:
    - Informationen zu Betriebssystemunterstützung oder Installationspfaden gesucht
    - Entscheidung, wo das Gateway ausgeführt werden soll
summary: Übersicht der Plattformunterstützung (Gateway + Begleit-Apps)
title: Plattformen
x-i18n:
    generated_at: "2026-07-16T12:56:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw Core ist in TypeScript geschrieben. **Node ist die erforderliche Laufzeitumgebung**, da
der kanonische Zustandsspeicher `node:sqlite` verwendet. Bun steht weiterhin für die
Installation von Abhängigkeiten und Paketskripte zur Verfügung; siehe [Bun](/de/install/bun).

Begleit-Apps sind für Windows Hub, macOS (Menüleisten-App) und mobile Nodes
(iOS/Android) verfügbar. Begleit-Apps für Linux sind geplant, aber der Gateway wird bereits
vollständig unterstützt. Wählen Sie unter Windows Windows Hub als Desktop-App, die native
PowerShell-Installation für die primäre Verwendung im Terminal oder WSL2 für die
Linux-kompatibelste Gateway-Laufzeitumgebung.

## Betriebssystem auswählen

- macOS: [macOS](/de/platforms/macos)
- iOS: [iOS](/de/platforms/ios)
- Android: [Android](/de/platforms/android)
- Windows: [Windows](/de/platforms/windows)
- Linux: [Linux](/de/platforms/linux)

## VPS und Hosting

- VPS-Hub: [VPS-Hosting](/de/vps)
- Fly.io: [Fly.io](/de/install/fly)
- Hetzner (Docker): [Hetzner](/de/install/hetzner)
- GCP (Compute Engine): [GCP](/de/install/gcp)
- Azure (Linux-VM): [Azure](/de/install/azure)
- exe.dev (VM + HTTPS-Proxy): [exe.dev](/de/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/de/platforms/easyrunner)

## Häufig verwendete Links

- Installationsanleitung: [Erste Schritte](/de/start/getting-started)
- Windows Hub: [Windows](/de/platforms/windows)
- Gateway-Betriebshandbuch: [Gateway](/de/gateway)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Dienststatus: `openclaw gateway status`

## Installation des Gateway-Dienstes (CLI)

Verwenden Sie eine der folgenden Optionen (alle werden unterstützt):

- Assistent (empfohlen): `openclaw onboard --install-daemon`
- Direkt: `openclaw gateway install`
- Konfigurationsablauf: `openclaw configure` → wählen Sie **Gateway-Dienst**
- Reparieren/migrieren: `openclaw doctor` (bietet die Installation oder Reparatur des Dienstes an)

Das Dienstziel hängt vom Betriebssystem ab:

- macOS: LaunchAgent (`ai.openclaw.gateway` oder `ai.openclaw.<profile>` für ein benanntes Profil)
- Linux/WSL2: systemd-Benutzerdienst (`openclaw-gateway[-<profile>].service`)
- Natives Windows: Geplante Aufgabe (`OpenClaw Gateway` oder `OpenClaw Gateway (<profile>)`), mit einem benutzerspezifischen Anmeldeelement im Autostartordner als Fallback, wenn das Erstellen der Aufgabe verweigert wird

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Windows Hub](/de/platforms/windows)
- [macOS-App](/de/platforms/macos)
- [iOS-App](/de/platforms/ios)
