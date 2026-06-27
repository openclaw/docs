---
read_when:
    - Recherche de la prise en charge des systèmes d’exploitation ou des chemins d’installation
    - Choisir où exécuter le Gateway
summary: Présentation de la prise en charge des plateformes (Gateway + applications compagnons)
title: Plateformes
x-i18n:
    generated_at: "2026-06-27T17:42:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core est écrit en TypeScript. **Node est le runtime recommandé**.
Bun n’est pas recommandé pour le Gateway — problèmes connus avec les canaux WhatsApp et
Telegram ; consultez [Bun (expérimental)](/fr/install/bun) pour plus de détails.

Des applications compagnes existent pour Windows Hub, macOS (application de barre de menus) et les nœuds mobiles
(iOS/Android). Des applications compagnes Linux sont prévues, mais le Gateway est entièrement
pris en charge aujourd’hui. Sous Windows, choisissez Windows Hub pour l’application de bureau, l’installation PowerShell native pour une utilisation principalement en terminal, ou WSL2 pour le runtime Gateway le plus
compatible avec Linux.

## Choisir votre OS

- macOS : [macOS](/fr/platforms/macos)
- iOS : [iOS](/fr/platforms/ios)
- Android : [Android](/fr/platforms/android)
- Windows : [Windows](/fr/platforms/windows)
- Linux : [Linux](/fr/platforms/linux)

## VPS et hébergement

- Hub VPS : [Hébergement VPS](/fr/vps)
- Fly.io : [Fly.io](/fr/install/fly)
- Hetzner (Docker) : [Hetzner](/fr/install/hetzner)
- GCP (Compute Engine) : [GCP](/fr/install/gcp)
- Azure (VM Linux) : [Azure](/fr/install/azure)
- exe.dev (VM + proxy HTTPS) : [exe.dev](/fr/install/exe-dev)
- EasyRunner (Podman + Caddy) : [EasyRunner](/fr/platforms/easyrunner)

## Liens courants

- Guide d’installation : [Bien démarrer](/fr/start/getting-started)
- Windows Hub : [Windows](/fr/platforms/windows)
- Runbook du Gateway : [Gateway](/fr/gateway)
- Configuration du Gateway : [Configuration](/fr/gateway/configuration)
- État du service : `openclaw gateway status`

## Installation du service Gateway (CLI)

Utilisez l’une de ces options (toutes prises en charge) :

- Assistant (recommandé) : `openclaw onboard --install-daemon`
- Direct : `openclaw gateway install`
- Flux de configuration : `openclaw configure` → sélectionnez **Service Gateway**
- Réparer/migrer : `openclaw doctor` (propose d’installer ou de corriger le service)

La cible du service dépend de l’OS :

- macOS : LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>` ; ancien `com.openclaw.*`)
- Linux/WSL2 : service utilisateur systemd (`openclaw-gateway[-<profile>].service`)
- Windows natif : tâche planifiée (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), avec une solution de repli sous forme d’élément de connexion dans le dossier Démarrage par utilisateur si la création de la tâche est refusée

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Windows Hub](/fr/platforms/windows)
- [Application macOS](/fr/platforms/macos)
- [Application iOS](/fr/platforms/ios)
