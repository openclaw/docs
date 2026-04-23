---
read_when:
    - Recherche du statut de l’application compagnon Linux
    - Planifier la couverture de plateforme ou les contributions
    - Débogage des tuages OOM ou de l’exit 137 sur Linux sur un VPS ou dans un conteneur
summary: Prise en charge de Linux + état de l’application compagnon
title: Application Linux
x-i18n:
    generated_at: "2026-04-23T07:05:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Application Linux

Le Gateway est entièrement pris en charge sous Linux. **Node est le runtime recommandé**.
Bun n’est pas recommandé pour le Gateway (bogues WhatsApp/Telegram).

Des applications compagnons Linux natives sont prévues. Les contributions sont les bienvenues si vous souhaitez aider à en créer une.

## Chemin rapide pour débutants (VPS)

1. Installez Node 24 (recommandé ; Node 22 LTS, actuellement `22.14+`, fonctionne encore pour la compatibilité)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Depuis votre ordinateur portable : `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Ouvrez `http://127.0.0.1:18789/` et authentifiez-vous avec le secret partagé configuré (jeton par défaut ; mot de passe si vous avez défini `gateway.auth.mode: "password"`)

Guide complet pour serveur Linux : [Linux Server](/fr/vps). Exemple VPS pas à pas : [exe.dev](/fr/install/exe-dev)

## Installation

- [Getting Started](/fr/start/getting-started)
- [Install & updates](/fr/install/updating)
- Flux facultatifs : [Bun (experimental)](/fr/install/bun), [Nix](/fr/install/nix), [Docker](/fr/install/docker)

## Gateway

- [Gateway runbook](/fr/gateway)
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

Sélectionnez **Gateway service** lorsque cela vous est demandé.

Réparer/migrer :

```
openclaw doctor
```

## Contrôle système (unité utilisateur systemd)

OpenClaw installe par défaut un service utilisateur systemd. Utilisez un service **système**
pour les serveurs partagés ou toujours actifs. `openclaw gateway install` et
`openclaw onboard --install-daemon` génèrent déjà l’unité canonique actuelle
pour vous ; n’en écrivez une à la main que si vous avez besoin d’une configuration personnalisée du système/gestionnaire de services.
Le guide complet sur les services se trouve dans le [Gateway runbook](/fr/gateway).

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

Activez-le :

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pression mémoire et tuages OOM

Sous Linux, le noyau choisit une victime OOM lorsqu’un hôte, une VM ou un cgroup de conteneur
manque de mémoire. Le Gateway peut être une mauvaise victime parce qu’il détient des sessions de longue durée
et des connexions de canaux. OpenClaw favorise donc, lorsque c’est possible, la suppression des processus enfants transitoires avant celle du Gateway.

Pour les lancements d’enfants Linux éligibles, OpenClaw démarre le processus enfant via un court
wrapper `/bin/sh` qui élève le `oom_score_adj` du processus enfant à `1000`, puis
fait `exec` de la commande réelle. C’est une opération non privilégiée parce que l’enfant
ne fait qu’augmenter sa propre probabilité d’être tué par OOM.

Les surfaces couvertes pour les processus enfants incluent :

- les processus enfants de commande gérés par supervisor,
- les processus enfants de shell PTY,
- les processus enfants de serveur MCP stdio,
- les processus navigateur/Chrome lancés par OpenClaw.

Le wrapper est spécifique à Linux et est ignoré lorsque `/bin/sh` n’est pas disponible. Il est
également ignoré si l’environnement enfant définit `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` ou `off`.

Pour vérifier un processus enfant :

```bash
cat /proc/<child-pid>/oom_score_adj
```

La valeur attendue pour les processus enfants couverts est `1000`. Le processus Gateway doit conserver
son score normal, généralement `0`.

Cela ne remplace pas le réglage mémoire normal. Si un VPS ou un conteneur tue de façon répétée des processus enfants, augmentez la limite mémoire, réduisez la concurrence ou ajoutez des contrôles de ressources plus stricts tels que `MemoryMax=` de systemd ou des limites mémoire au niveau du conteneur.
