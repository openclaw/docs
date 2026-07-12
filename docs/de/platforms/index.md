---
read_when:
    - Auf der Suche nach Betriebssystemunterstützung oder Installationspfaden
    - Entscheidung, wo das Gateway ausgeführt werden soll
summary: Übersicht der Plattformunterstützung (Gateway + Begleit-Apps)
title: Plattformen
x-i18n:
    generated_at: "2026-07-12T15:37:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Der OpenClaw-Kern ist in TypeScript geschrieben. **Node ist die empfohlene Laufzeitumgebung**.
Bun wird für den Gateway nicht empfohlen – es gibt bekannte Probleme mit WhatsApp- und
Telegram-Kanälen; Einzelheiten finden Sie unter [Bun (experimentell)](/de/install/bun).

Begleit-Apps sind für Windows Hub, macOS (Menüleisten-App) und mobile Nodes
(iOS/Android) verfügbar. Begleit-Apps für Linux sind geplant, der Gateway wird jedoch bereits
vollständig unterstützt. Wählen Sie unter Windows den Windows Hub als Desktop-App, die native
PowerShell-Installation für die primäre Nutzung im Terminal oder WSL2 für die am stärksten
Linux-kompatible Gateway-Laufzeitumgebung.

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

## Häufig verwendete Links

- Installationsanleitung: [Erste Schritte](/de/start/getting-started)
- Windows Hub: [Windows](/de/platforms/windows)
- Gateway-Betriebshandbuch: [Gateway](/de/gateway)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Dienststatus: `openclaw gateway status`

## Installation des Gateway-Dienstes (CLI)

Verwenden Sie eine dieser Optionen (alle werden unterstützt):

- Assistent (empfohlen): `openclaw onboard --install-daemon`
- Direkt: `openclaw gateway install`
- Konfigurationsablauf: `openclaw configure` → wählen Sie **Gateway-Dienst**
- Reparieren/migrieren: `openclaw doctor` (bietet an, den Dienst zu installieren oder zu reparieren)

Das Dienstziel hängt vom Betriebssystem ab:

- macOS: LaunchAgent (`ai.openclaw.gateway` oder `ai.openclaw.<profile>` für ein benanntes Profil)
- Linux/WSL2: systemd-Benutzerdienst (`openclaw-gateway[-<profile>].service`)
- Natives Windows: Geplante Aufgabe (`OpenClaw Gateway` oder `OpenClaw Gateway (<profile>)`) mit einem benutzerspezifischen Anmeldeelement im Autostartordner als Ausweichlösung, falls die Aufgabenerstellung verweigert wird

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Windows Hub](/de/platforms/windows)
- [macOS-App](/de/platforms/macos)
- [iOS-App](/de/platforms/ios)
