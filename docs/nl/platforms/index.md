---
read_when:
    - Op zoek naar OS-ondersteuning of installatiepaden
    - Bepalen waar de Gateway moet worden uitgevoerd
summary: Overzicht van platformondersteuning (Gateway + begeleidende apps)
title: Platformen
x-i18n:
    generated_at: "2026-07-12T09:05:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

De OpenClaw-kern is geschreven in TypeScript. **Node is de aanbevolen runtime**.
Bun wordt niet aanbevolen voor de Gateway vanwege bekende problemen met WhatsApp- en
Telegram-kanalen; zie [Bun (experimenteel)](/nl/install/bun) voor meer informatie.

Er zijn aanvullende apps voor Windows Hub, macOS (menubalk-app) en mobiele nodes
(iOS/Android). Aanvullende Linux-apps staan gepland, maar de Gateway wordt momenteel
volledig ondersteund. Kies op Windows voor Windows Hub als desktop-app, een systeemeigen
PowerShell-installatie voor hoofdzakelijk terminalgebaseerd gebruik of WSL2 voor de meest
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

Gebruik een van deze opties (alle worden ondersteund):

- Wizard (aanbevolen): `openclaw onboard --install-daemon`
- Rechtstreeks: `openclaw gateway install`
- Configuratieproces: `openclaw configure` → selecteer **Gateway-service**
- Repareren/migreren: `openclaw doctor` (biedt aan de service te installeren of te repareren)

Het servicedoel is afhankelijk van het besturingssysteem:

- macOS: LaunchAgent (`ai.openclaw.gateway`, of `ai.openclaw.<profile>` voor een benoemd profiel)
- Linux/WSL2: systemd-gebruikersservice (`openclaw-gateway[-<profile>].service`)
- Systeemeigen Windows: geplande taak (`OpenClaw Gateway` of `OpenClaw Gateway (<profile>)`), met als terugvaloptie een aanmeldingsitem per gebruiker in de map Opstarten als het maken van taken wordt geweigerd

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Windows Hub](/nl/platforms/windows)
- [macOS-app](/nl/platforms/macos)
- [iOS-app](/nl/platforms/ios)
