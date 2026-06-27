---
read_when:
    - Suchen Sie OS-Unterstützung oder Installationspfade?
    - Entscheiden, wo der Gateway ausgeführt werden soll
summary: Übersicht zur Plattformunterstützung (Gateway + Companion-Apps)
title: Plattformen
x-i18n:
    generated_at: "2026-06-27T17:42:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw Core ist in TypeScript geschrieben. **Node ist die empfohlene Runtime**.
Bun wird für den Gateway nicht empfohlen — bekannte Probleme mit WhatsApp- und
Telegram-Kanälen; siehe [Bun (experimentell)](/de/install/bun) für Details.

Companion-Apps gibt es für Windows Hub, macOS (Menüleisten-App) und mobile Nodes
(iOS/Android). Linux-Companion-Apps sind geplant, aber der Gateway wird heute
vollständig unterstützt. Unter Windows wählen Sie Windows Hub für die Desktop-App, die native
PowerShell-Installation für terminalorientierte Nutzung oder WSL2 für die am stärksten
Linux-kompatible Gateway-Runtime.

## Wählen Sie Ihr Betriebssystem

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

## Häufige Links

- Installationsanleitung: [Erste Schritte](/de/start/getting-started)
- Windows Hub: [Windows](/de/platforms/windows)
- Gateway-Runbook: [Gateway](/de/gateway)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Dienststatus: `openclaw gateway status`

## Gateway-Dienstinstallation (CLI)

Verwenden Sie eine dieser Optionen (alle werden unterstützt):

- Assistent (empfohlen): `openclaw onboard --install-daemon`
- Direkt: `openclaw gateway install`
- Konfigurationsablauf: `openclaw configure` → **Gateway service** auswählen
- Reparieren/migrieren: `openclaw doctor` (bietet an, den Dienst zu installieren oder zu reparieren)

Das Dienstziel hängt vom Betriebssystem ab:

- macOS: LaunchAgent (`ai.openclaw.gateway` oder `ai.openclaw.<profile>`; Legacy `com.openclaw.*`)
- Linux/WSL2: systemd-Benutzerdienst (`openclaw-gateway[-<profile>].service`)
- Natives Windows: Geplante Aufgabe (`OpenClaw Gateway` oder `OpenClaw Gateway (<profile>)`), mit einem benutzerspezifischen Login-Element im Autostartordner als Fallback, falls die Aufgabenerstellung verweigert wird

## Verwandt

- [Installationsübersicht](/de/install)
- [Windows Hub](/de/platforms/windows)
- [macOS-App](/de/platforms/macos)
- [iOS-App](/de/platforms/ios)
