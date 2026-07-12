---
read_when:
    - Recherche de l’état de l’application compagnon Linux
    - Planification de la prise en charge des plateformes ou des contributions
    - Débogage des arrêts pour mémoire insuffisante (OOM) sous Linux ou du code de sortie 137 sur un VPS ou dans un conteneur
summary: Prise en charge de Linux + état de l’application compagnon
title: Application Linux
x-i18n:
    generated_at: "2026-07-12T15:36:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Le Gateway est entièrement pris en charge sous Linux. Node est l’environnement d’exécution recommandé ; Bun
n’est pas recommandé (problèmes connus avec WhatsApp/Telegram).

Il n’existe pas encore d’application compagnon Linux native. Les contributions sont les bienvenues.

## Parcours rapide (VPS)

1. Installez Node 24 (recommandé) ou Node 22.19+ (LTS, toujours pris en charge).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Depuis votre ordinateur portable : `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Ouvrez `http://127.0.0.1:18789/` et authentifiez-vous avec le secret partagé
   configuré (jeton par défaut ; mot de passe si `gateway.auth.mode` vaut `"password"`).

Guide complet du serveur : [Serveur Linux](/fr/vps). Exemple de VPS étape par étape :
[exe.dev](/fr/install/exe-dev).

## Installation

- [Bien démarrer](/fr/start/getting-started)
- [Installation et mises à jour](/fr/install/updating)
- Facultatif : [Bun (expérimental)](/fr/install/bun), [Nix](/fr/install/nix), [Docker](/fr/install/docker)

## Service Gateway (systemd)

Installez-le avec l’une des commandes suivantes :

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # sélectionnez « Gateway service » lorsque vous y êtes invité
```

Réparez ou migrez une installation existante :

```bash
openclaw doctor
```

`openclaw gateway install` génère par défaut une unité systemd **utilisateur**. Les
instructions complètes sur le service, notamment la variante d’unité au niveau
**système** pour les hôtes partagés ou toujours actifs, figurent dans le [guide d’exploitation du Gateway](/fr/gateway#supervision-and-service-lifecycle).

Créez manuellement une unité uniquement pour une configuration personnalisée. Exemple minimal d’unité utilisateur
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`) :

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Activez-la :

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pression mémoire et arrêts par l’OOM killer

Sous Linux, le noyau choisit un processus victime de l’OOM killer lorsqu’un hôte, une VM ou un cgroup de conteneur
manque de mémoire. Le Gateway est un mauvais choix comme victime, car il gère des
sessions et des connexions aux canaux de longue durée ; OpenClaw favorise donc, lorsque cela est possible, l’arrêt en premier des processus enfants
transitoires.

Pour les lancements de processus enfants Linux admissibles, OpenClaw encapsule la commande dans un court
shim `/bin/sh` qui augmente la valeur `oom_score_adj` propre à l’enfant à `1000`, puis
exécute la commande réelle avec `exec`. Cette opération ne nécessite aucun privilège : un processus peut toujours augmenter
son propre score OOM.

Surfaces de processus enfants couvertes :

- Processus enfants de commande gérés par le superviseur
- Processus enfants de shell PTY
- Processus enfants de serveur MCP stdio
- Processus de navigateur/Chrome lancés par OpenClaw (via l’environnement d’exécution des processus du SDK de Plugin)

L’encapsuleur est réservé à Linux et est ignoré lorsque `/bin/sh` n’est pas disponible, ou lorsque
l’environnement de l’enfant définit `OPENCLAW_CHILD_OOM_SCORE_ADJ` sur `0`, `false`, `no` ou
`off`.

Vérifiez un processus enfant :

```bash
cat /proc/<child-pid>/oom_score_adj
```

La valeur attendue pour les processus enfants couverts est `1000` ; le processus Gateway lui-même
conserve son score normal (généralement `0`).

La directive `OOMPolicy=continue` de l’unité systemd maintient le service Gateway actif lorsqu’un
processus enfant transitoire est sélectionné par l’OOM killer, au lieu de marquer l’ensemble de
l’unité comme défaillante et de redémarrer tous les canaux ; le processus enfant ou la session en échec signale sa
propre erreur.

Cela ne remplace pas un réglage normal de la mémoire. Si un VPS ou un conteneur arrête régulièrement
des processus enfants, augmentez la limite de mémoire, réduisez la concurrence ou ajoutez des
contrôles de ressources plus stricts (`MemoryMax=` de systemd, limites de mémoire du conteneur).

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Raspberry Pi](/fr/install/raspberry-pi)
- [Guide d’exploitation du Gateway](/fr/gateway)
- [Configuration du Gateway](/fr/gateway/configuration)
