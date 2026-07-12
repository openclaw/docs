---
read_when:
    - Recherche de la compatibilité avec les systèmes d’exploitation ou des méthodes d’installation
    - Choisir où exécuter le Gateway
summary: Vue d’ensemble de la prise en charge des plateformes (Gateway + applications compagnons)
title: Plateformes
x-i18n:
    generated_at: "2026-07-12T02:47:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

Le cœur d’OpenClaw est écrit en TypeScript. **Node est l’environnement d’exécution recommandé**.
Bun n’est pas recommandé pour le Gateway en raison de problèmes connus avec les
canaux WhatsApp et Telegram ; consultez [Bun (expérimental)](/fr/install/bun) pour plus de détails.

Des applications compagnons existent pour Windows Hub, macOS (application de barre des menus) et les nœuds mobiles
(iOS/Android). Des applications compagnons Linux sont prévues, mais le Gateway est
dès aujourd’hui entièrement pris en charge. Sous Windows, choisissez Windows Hub comme application de bureau, l’installation
PowerShell native pour une utilisation principalement axée sur le terminal, ou WSL2 pour bénéficier de l’environnement d’exécution du Gateway
le plus compatible avec Linux.

## Choisissez votre système d’exploitation

- macOS : [macOS](/fr/platforms/macos)
- iOS : [iOS](/fr/platforms/ios)
- Android : [Android](/fr/platforms/android)
- Windows : [Windows](/fr/platforms/windows)
- Linux : [Linux](/fr/platforms/linux)

## VPS et hébergement

- Hub VPS : [Hébergement sur VPS](/fr/vps)
- Fly.io : [Fly.io](/fr/install/fly)
- Hetzner (Docker) : [Hetzner](/fr/install/hetzner)
- GCP (Compute Engine) : [GCP](/fr/install/gcp)
- Azure (machine virtuelle Linux) : [Azure](/fr/install/azure)
- exe.dev (machine virtuelle + proxy HTTPS) : [exe.dev](/fr/install/exe-dev)
- EasyRunner (Podman + Caddy) : [EasyRunner](/fr/platforms/easyrunner)

## Liens courants

- Guide d’installation : [Bien démarrer](/fr/start/getting-started)
- Windows Hub : [Windows](/fr/platforms/windows)
- Guide d’exploitation du Gateway : [Gateway](/fr/gateway)
- Configuration du Gateway : [Configuration](/fr/gateway/configuration)
- État du service : `openclaw gateway status`

## Installation du service Gateway (CLI)

Utilisez l’une des méthodes suivantes (toutes sont prises en charge) :

- Assistant (recommandé) : `openclaw onboard --install-daemon`
- Directement : `openclaw gateway install`
- Parcours de configuration : `openclaw configure` → sélectionnez **Service Gateway**
- Réparation/migration : `openclaw doctor` (propose d’installer ou de réparer le service)

La cible du service dépend du système d’exploitation :

- macOS : LaunchAgent (`ai.openclaw.gateway`, ou `ai.openclaw.<profile>` pour un profil nommé)
- Linux/WSL2 : service utilisateur systemd (`openclaw-gateway[-<profile>].service`)
- Windows natif : tâche planifiée (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), avec comme solution de secours un élément de connexion par utilisateur dans le dossier de démarrage si la création de la tâche est refusée

## Ressources associées

- [Présentation de l’installation](/fr/install)
- [Windows Hub](/fr/platforms/windows)
- [Application macOS](/fr/platforms/macos)
- [Application iOS](/fr/platforms/ios)
