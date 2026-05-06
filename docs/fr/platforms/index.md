---
read_when:
    - Recherche de la prise en charge des systèmes d’exploitation ou des chemins d’installation
    - Choisir où exécuter le Gateway
summary: Vue d’ensemble de la prise en charge des plateformes (Gateway + applications d’accompagnement)
title: Plateformes
x-i18n:
    generated_at: "2026-05-06T07:30:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw core est écrit en TypeScript. **Node est l’environnement d’exécution recommandé**.
Bun n’est pas recommandé pour le Gateway — problèmes connus avec les canaux WhatsApp et
Telegram ; consultez [Bun (expérimental)](/fr/install/bun) pour plus de détails.

Des applications compagnons existent pour macOS (application de barre de menus) et les nœuds mobiles (iOS/Android). Des applications compagnons Windows et
Linux sont prévues, mais le Gateway est entièrement pris en charge aujourd’hui.
Des applications compagnons natives pour Windows sont également prévues ; le Gateway est recommandé via WSL2.

## Choisissez votre OS

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

## Liens courants

- Guide d’installation : [Bien démarrer](/fr/start/getting-started)
- Runbook du Gateway : [Gateway](/fr/gateway)
- Configuration du Gateway : [Configuration](/fr/gateway/configuration)
- État du service : `openclaw gateway status`

## Installation du service Gateway (CLI)

Utilisez l’une de ces options (toutes prises en charge) :

- Assistant (recommandé) : `openclaw onboard --install-daemon`
- Direct : `openclaw gateway install`
- Flux de configuration : `openclaw configure` → sélectionnez **service Gateway**
- Réparer/migrer : `openclaw doctor` (propose d’installer ou de corriger le service)

La cible du service dépend de l’OS :

- macOS : LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>` ; ancien `com.openclaw.*`)
- Linux/WSL2 : service utilisateur systemd (`openclaw-gateway[-<profile>].service`)
- Windows natif : tâche planifiée (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), avec un élément de connexion de secours dans le dossier de démarrage par utilisateur si la création de la tâche est refusée

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Application macOS](/fr/platforms/macos)
- [Application iOS](/fr/platforms/ios)
