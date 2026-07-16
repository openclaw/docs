---
read_when:
    - Op zoek naar OS-ondersteuning of installatiepaden
    - Bepalen waar de Gateway moet worden uitgevoerd
summary: Overzicht van platformondersteuning (Gateway + bijbehorende apps)
title: Platformen
x-i18n:
    generated_at: "2026-07-16T15:52:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core is geschreven in TypeScript. **Node is de vereiste runtime** omdat
de canonieke statusopslag `node:sqlite` gebruikt. Bun blijft beschikbaar voor
de installatie van afhankelijkheden en pakketscripts; zie [Bun](/nl/install/bun).

Er zijn begeleidende apps voor Windows Hub, macOS (menubalk-app) en mobiele nodes
(iOS/Android). Begeleidende Linux-apps zijn gepland, maar de Gateway wordt
momenteel volledig ondersteund. Kies op Windows voor Windows Hub als desktop-app, een
native PowerShell-installatie voor primair gebruik via de terminal, of WSL2 voor de meest
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

- Installatiehandleiding: [Aan de slag](/nl/start/getting-started)
- Windows Hub: [Windows](/nl/platforms/windows)
- Gateway-draaiboek: [Gateway](/nl/gateway)
- Gateway-configuratie: [Configuratie](/nl/gateway/configuration)
- Servicestatus: `openclaw gateway status`

## Gateway-service installeren (CLI)

Gebruik een van deze opties (ze worden allemaal ondersteund):

- Wizard (aanbevolen): `openclaw onboard --install-daemon`
- Rechtstreeks: `openclaw gateway install`
- Configuratieproces: `openclaw configure` → selecteer **Gateway-service**
- Herstellen/migreren: `openclaw doctor` (biedt aan de service te installeren of te herstellen)

Het servicedoel is afhankelijk van het besturingssysteem:

- macOS: LaunchAgent (`ai.openclaw.gateway`, of `ai.openclaw.<profile>` voor een benoemd profiel)
- Linux/WSL2: systemd-gebruikersservice (`openclaw-gateway[-<profile>].service`)
- Native Windows: Scheduled Task (`OpenClaw Gateway` of `OpenClaw Gateway (<profile>)`), met als terugvaloptie een aanmeldingsitem per gebruiker in de map Startup als het maken van de taak wordt geweigerd

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Windows Hub](/nl/platforms/windows)
- [macOS-app](/nl/platforms/macos)
- [iOS-app](/nl/platforms/ios)
