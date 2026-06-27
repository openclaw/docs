---
read_when:
    - Recherche de l’état de l’application compagnon Linux
    - Planifier la couverture de la plateforme ou les contributions
    - Déboguer les arrêts OOM Linux ou les sorties 137 sur un VPS ou dans un conteneur
summary: Prise en charge de Linux + état de l’application compagnon
title: Application Linux
x-i18n:
    generated_at: "2026-06-27T17:43:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Le Gateway est entièrement pris en charge sur Linux. **Node est le runtime recommandé**.
Bun n’est pas recommandé pour le Gateway (bogues WhatsApp/Telegram).

Des applications compagnons Linux natives sont prévues. Les contributions sont les bienvenues si vous souhaitez aider à en créer une.

## Parcours rapide pour débutants (VPS)

1. Installez Node 24 (recommandé ; Node 22 LTS, actuellement `22.19+`, fonctionne toujours pour la compatibilité)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Depuis votre ordinateur portable : `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Ouvrez `http://127.0.0.1:18789/` et authentifiez-vous avec le secret partagé configuré (jeton par défaut ; mot de passe si vous avez défini `gateway.auth.mode: "password"`)

Guide complet du serveur Linux : [Serveur Linux](/fr/vps). Exemple VPS étape par étape : [exe.dev](/fr/install/exe-dev)

## Installation

- [Bien démarrer](/fr/start/getting-started)
- [Installation et mises à jour](/fr/install/updating)
- Flux facultatifs : [Bun (expérimental)](/fr/install/bun), [Nix](/fr/install/nix), [Docker](/fr/install/docker)

## Gateway

- [Runbook du Gateway](/fr/gateway)
- [Configuration](/fr/gateway/configuration)

## Installation du service Gateway (CLI)

Utilisez l’une de ces commandes :

```
openclaw onboard --install-daemon
```

Ou :

```
openclaw gateway install
```

Ou :

```
openclaw configure
```

Sélectionnez **Service Gateway** lorsque vous y êtes invité.

Réparer/migrer :

```
openclaw doctor
```

## Contrôle du système (unité utilisateur systemd)

OpenClaw installe par défaut un service **utilisateur** systemd. Utilisez un
service **système** pour les serveurs partagés ou toujours actifs. `openclaw gateway install` et
`openclaw onboard --install-daemon` génèrent déjà l’unité canonique actuelle
pour vous ; écrivez-en une manuellement uniquement lorsque vous avez besoin d’une configuration
système/gestionnaire de services personnalisée. Les recommandations complètes sur le service se trouvent dans le [runbook du Gateway](/fr/gateway).

Configuration minimale :

Créez `~/.config/systemd/user/openclaw-gateway[-<profile>].service` :

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Activez-le :

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pression mémoire et terminaisons OOM

Sur Linux, le noyau choisit une victime OOM lorsqu’un hôte, une VM ou un cgroup
de conteneur manque de mémoire. Le Gateway peut être une mauvaise victime, car il possède des
sessions longues et des connexions de canaux. OpenClaw favorise donc, lorsque possible,
la terminaison des processus enfants transitoires avant celle du Gateway.

Pour les lancements de processus enfants Linux éligibles, OpenClaw démarre l’enfant via un court
wrapper `/bin/sh` qui augmente le `oom_score_adj` propre à l’enfant à `1000`, puis
exécute la vraie commande avec `exec`. Il s’agit d’une opération sans privilèges, car l’enfant
augmente uniquement sa propre probabilité d’être tué par OOM.

Les surfaces de processus enfants couvertes incluent :

- les enfants de commandes gérés par le superviseur,
- les enfants de shell PTY,
- les enfants de serveurs MCP stdio,
- les processus navigateur/Chrome lancés par OpenClaw.

Le wrapper est propre à Linux et est ignoré lorsque `/bin/sh` n’est pas disponible. Il est
également ignoré si l’environnement de l’enfant définit `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` ou `off`.

Pour vérifier un processus enfant :

```bash
cat /proc/<child-pid>/oom_score_adj
```

La valeur attendue pour les enfants couverts est `1000`. Le processus Gateway doit conserver
son score normal, généralement `0`.

L’unité systemd recommandée définit également `OOMPolicy=continue`. Cela maintient l’unité
Gateway active lorsqu’un processus enfant transitoire est sélectionné par l’OOM killer ;
la commande/session enfant peut échouer et signaler son erreur sans que systemd ne marque
tout le service gateway comme échoué et ne redémarre tous les canaux.

Cela ne remplace pas le réglage normal de la mémoire. Si un VPS ou un conteneur tue régulièrement
des enfants, augmentez la limite de mémoire, réduisez la concurrence ou ajoutez des contrôles
de ressources plus stricts, comme `MemoryMax=` de systemd ou des limites de mémoire au niveau du conteneur.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Raspberry Pi](/fr/install/raspberry-pi)
