---
read_when:
    - Suche nach Betriebssystemunterstützung oder Installationspfaden
    - Entscheiden, wo das Gateway ausgeführt werden soll
summary: Überblick zur Plattformunterstützung (Gateway + Begleit-Apps)
title: Plattformen
x-i18n:
    generated_at: "2026-05-06T06:55:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw-Kern ist in TypeScript geschrieben. **Node ist die empfohlene Runtime**.
Bun wird für das Gateway nicht empfohlen — bekannte Probleme mit WhatsApp- und
Telegram-Kanälen; Details finden Sie unter [Bun (experimentell)](/de/install/bun).

Begleit-Apps gibt es für macOS (Menüleisten-App) und mobile Nodes (iOS/Android). Begleit-Apps für Windows und
Linux sind geplant, aber das Gateway wird bereits heute vollständig unterstützt.
Native Begleit-Apps für Windows sind ebenfalls geplant; das Gateway wird über WSL2 empfohlen.

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

## Häufige Links

- Installationsanleitung: [Erste Schritte](/de/start/getting-started)
- Gateway-Runbook: [Gateway](/de/gateway)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Dienststatus: `openclaw gateway status`

## Installation des Gateway-Dienstes (CLI)

Verwenden Sie eine dieser Optionen (alle werden unterstützt):

- Assistent (empfohlen): `openclaw onboard --install-daemon`
- Direkt: `openclaw gateway install`
- Konfigurationsablauf: `openclaw configure` → **Gateway-Dienst** auswählen
- Reparieren/migrieren: `openclaw doctor` (bietet an, den Dienst zu installieren oder zu reparieren)

Das Dienstziel hängt vom Betriebssystem ab:

- macOS: LaunchAgent (`ai.openclaw.gateway` oder `ai.openclaw.<profile>`; Legacy `com.openclaw.*`)
- Linux/WSL2: systemd-Benutzerdienst (`openclaw-gateway[-<profile>].service`)
- Natives Windows: Geplante Aufgabe (`OpenClaw Gateway` oder `OpenClaw Gateway (<profile>)`), mit einem benutzerspezifischen Anmeldeelement im Autostart-Ordner als Fallback, falls die Aufgabenerstellung verweigert wird

## Verwandt

- [Installationsübersicht](/de/install)
- [macOS-App](/de/platforms/macos)
- [iOS-App](/de/platforms/ios)
