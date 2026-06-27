---
read_when:
    - Zoekt naar OS-ondersteuning of installatiepaden
    - Bepalen waar de Gateway moet draaien
summary: Overzicht van platformondersteuning (Gateway + companion-apps)
title: Platformen
x-i18n:
    generated_at: "2026-06-27T17:47:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core is geschreven in TypeScript. **Node is de aanbevolen runtime**.
Bun wordt niet aanbevolen voor de Gateway — bekende problemen met WhatsApp- en
Telegram-kanalen; zie [Bun (experimenteel)](/nl/install/bun) voor details.

Companion-apps bestaan voor Windows Hub, macOS (menubalk-app) en mobiele nodes
(iOS/Android). Linux-companion-apps zijn gepland, maar de Gateway wordt vandaag
volledig ondersteund. Kies op Windows Windows Hub voor de desktop-app, native
PowerShell-installatie voor terminalgericht gebruik, of WSL2 voor de meest
Linux-compatibele Gateway-runtime.

## Kies je besturingssysteem

- macOS: [macOS](/nl/platforms/macos)
- iOS: [iOS](/nl/platforms/ios)
- Android: [Android](/nl/platforms/android)
- Windows: [Windows](/nl/platforms/windows)
- Linux: [Linux](/nl/platforms/linux)

## VPS en hosting

- VPS-hub: [VPS-hosting](/nl/vps)
- Fly.io: [Fly.io](/nl/install/fly)
- Hetzner (Docker): [Hetzner](/nl/install/hetzner)
- GCP (Compute Engine): [GCP](/nl/install/gcp)
- Azure (Linux-VM): [Azure](/nl/install/azure)
- exe.dev (VM + HTTPS-proxy): [exe.dev](/nl/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/nl/platforms/easyrunner)

## Veelgebruikte links

- Installatiegids: [Aan de slag](/nl/start/getting-started)
- Windows Hub: [Windows](/nl/platforms/windows)
- Gateway-runbook: [Gateway](/nl/gateway)
- Gateway-configuratie: [Configuratie](/nl/gateway/configuration)
- Servicestatus: `openclaw gateway status`

## Gateway-service-installatie (CLI)

Gebruik een van deze (allemaal ondersteund):

- Wizard (aanbevolen): `openclaw onboard --install-daemon`
- Direct: `openclaw gateway install`
- Configuratiestroom: `openclaw configure` → selecteer **Gateway-service**
- Repareren/migreren: `openclaw doctor` (biedt aan de service te installeren of te herstellen)

Het servicedoel hangt af van het besturingssysteem:

- macOS: LaunchAgent (`ai.openclaw.gateway` of `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: systemd-gebruikersservice (`openclaw-gateway[-<profile>].service`)
- Native Windows: Scheduled Task (`OpenClaw Gateway` of `OpenClaw Gateway (<profile>)`), met een fallback voor een per-gebruiker login-item in de Startup-map als het maken van de taak wordt geweigerd

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Windows Hub](/nl/platforms/windows)
- [macOS-app](/nl/platforms/macos)
- [iOS-app](/nl/platforms/ios)
