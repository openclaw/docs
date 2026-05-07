---
read_when:
    - Recherche de l’état de l’application compagnon Linux
    - Planification de la couverture des plateformes ou des contributions
    - Débogage des arrêts OOM sous Linux ou du code de sortie 137 sur un VPS ou un conteneur
summary: Prise en charge de Linux + état de l’application compagnon
title: Application Linux
x-i18n:
    generated_at: "2026-05-07T13:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Le Gateway est entièrement pris en charge sur Linux. **Node est l’environnement d’exécution recommandé**.
Bun n’est pas recommandé pour le Gateway (bogues WhatsApp/Telegram).

Des applications compagnons Linux natives sont prévues. Les contributions sont les bienvenues si vous voulez aider à en créer une.

## Parcours rapide débutant (VPS)

1. Installez Node 24 (recommandé ; Node 22 LTS, actuellement `22.16+`, fonctionne toujours pour la compatibilité)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Depuis votre ordinateur portable : `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Ouvrez `http://127.0.0.1:18789/` et authentifiez-vous avec le secret partagé configuré (jeton par défaut ; mot de passe si vous définissez `gateway.auth.mode: "password"`)

Guide complet du serveur Linux : [Serveur Linux](/fr/vps). Exemple VPS étape par étape : [exe.dev](/fr/install/exe-dev)

## Installation

- [Bien démarrer](/fr/start/getting-started)
- [Installation et mises à jour](/fr/install/updating)
- Flux optionnels : [Bun (expérimental)](/fr/install/bun), [Nix](/fr/install/nix), [Docker](/fr/install/docker)

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

## Contrôle système (unité utilisateur systemd)

OpenClaw installe par défaut un service **utilisateur** systemd. Utilisez un
service **système** pour les serveurs partagés ou toujours actifs. `openclaw gateway install` et
`openclaw onboard --install-daemon` génèrent déjà l’unité canonique actuelle
pour vous ; rédigez-en une à la main uniquement lorsque vous avez besoin d’une
configuration système/gestionnaire de services personnalisée. Les consignes complètes sur les services se trouvent dans le [runbook du Gateway](/fr/gateway).

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Activez-la :

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pression mémoire et arrêts OOM

Sous Linux, le noyau choisit une victime OOM lorsqu’un hôte, une VM ou un cgroup
de conteneur manque de mémoire. Le Gateway peut être une mauvaise victime, car il possède des
sessions durables et des connexions de canaux. OpenClaw privilégie donc l’arrêt
des processus enfants transitoires avant celui du Gateway lorsque c’est possible.

Pour les lancements de processus enfants Linux éligibles, OpenClaw démarre l’enfant au moyen d’un court
wrapper `/bin/sh` qui augmente le `oom_score_adj` propre à l’enfant à `1000`, puis
exécute la vraie commande avec `exec`. Il s’agit d’une opération non privilégiée, car l’enfant ne fait
qu’augmenter sa propre probabilité d’arrêt OOM.

Les surfaces de processus enfants couvertes incluent :

- les processus enfants de commandes gérés par le superviseur,
- les processus enfants de shells PTY,
- les processus enfants de serveurs MCP stdio,
- les processus browser/Chrome lancés par OpenClaw.

Le wrapper est propre à Linux et est ignoré lorsque `/bin/sh` n’est pas disponible. Il est
également ignoré si l’environnement de l’enfant définit `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` ou `off`.

Pour vérifier un processus enfant :

```bash
cat /proc/<child-pid>/oom_score_adj
```

La valeur attendue pour les enfants couverts est `1000`. Le processus Gateway doit conserver
son score normal, généralement `0`.

Cela ne remplace pas le réglage normal de la mémoire. Si un VPS ou un conteneur arrête
régulièrement des enfants, augmentez la limite de mémoire, réduisez la concurrence ou ajoutez des
contrôles de ressources plus stricts, comme `MemoryMax=` de systemd ou des limites de mémoire au niveau du conteneur.

## Associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Raspberry Pi](/fr/install/raspberry-pi)
