---
read_when:
    - Vous utilisez souvent OpenClaw avec Docker et souhaitez des commandes quotidiennes plus courtes
    - Vous souhaitez une couche d’assistance pour le tableau de bord, les journaux, la configuration des jetons et les flux d’appairage
summary: Assistants shell ClawDock pour les installations OpenClaw basées sur Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T07:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock est une petite couche d’assistance shell pour les installations OpenClaw basées sur Docker.

Elle vous fournit des commandes courtes comme `clawdock-start`, `clawdock-dashboard` et `clawdock-fix-token` au lieu d’invocations plus longues de type `docker compose ...`.

Si vous n’avez pas encore configuré Docker, commencez par [Docker](/fr/install/docker).

## Installation

Utilisez le chemin canonique de l’assistant :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous aviez précédemment installé ClawDock depuis `scripts/shell-helpers/clawdock-helpers.sh`, réinstallez-le depuis le nouveau chemin `scripts/clawdock/clawdock-helpers.sh`. L’ancien chemin brut GitHub a été supprimé.

## Ce que vous obtenez

### Opérations de base

| Command            | Description            |
| ------------------ | ---------------------- |
| `clawdock-start`   | Démarrer le Gateway    |
| `clawdock-stop`    | Arrêter le Gateway     |
| `clawdock-restart` | Redémarrer le Gateway  |
| `clawdock-status`  | Vérifier l’état du conteneur |
| `clawdock-logs`    | Suivre les journaux du Gateway |

### Accès au conteneur

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Ouvrir un shell dans le conteneur du Gateway  |
| `clawdock-cli <command>`  | Exécuter des commandes CLI OpenClaw dans Docker |
| `clawdock-exec <command>` | Exécuter une commande arbitraire dans le conteneur |

### Interface Web et appairage

| Command                 | Description                  |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | Ouvrir l’URL de la Control UI |
| `clawdock-devices`      | Lister les appairages d’appareils en attente |
| `clawdock-approve <id>` | Approuver une demande d’appairage |

### Configuration et maintenance

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Configurer le jeton du Gateway dans le conteneur |
| `clawdock-update`    | Tirer, reconstruire et redémarrer                |
| `clawdock-rebuild`   | Reconstruire uniquement l’image Docker           |
| `clawdock-clean`     | Supprimer les conteneurs et les volumes          |

### Utilitaires

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | Exécuter un contrôle de santé du Gateway |
| `clawdock-token`       | Afficher le jeton du Gateway            |
| `clawdock-cd`          | Aller au répertoire du projet OpenClaw  |
| `clawdock-config`      | Ouvrir `~/.openclaw`                    |
| `clawdock-show-config` | Afficher les fichiers de configuration avec les valeurs masquées |
| `clawdock-workspace`   | Ouvrir le répertoire de l’espace de travail |

## Premier parcours

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Si le navigateur indique qu’un appairage est requis :

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuration et secrets

ClawDock fonctionne avec la même séparation de configuration Docker que celle décrite dans [Docker](/fr/install/docker) :

- `<project>/.env` pour les valeurs propres à Docker, comme le nom de l’image, les ports et le jeton du Gateway
- `~/.openclaw/.env` pour les clés de fournisseurs et les jetons de bots basés sur l’environnement
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/API-key de fournisseur stockée
- `~/.openclaw/openclaw.json` pour la configuration du comportement

Utilisez `clawdock-show-config` lorsque vous voulez inspecter rapidement les fichiers `.env` et `openclaw.json`. Il masque les valeurs `.env` dans sa sortie affichée.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Docker" href="/fr/install/docker" icon="docker">
    Installation Docker canonique pour OpenClaw.
  </Card>
  <Card title="Runtime de VM Docker" href="/fr/install/docker-vm-runtime" icon="cube">
    Runtime de VM géré par Docker pour une isolation renforcée.
  </Card>
  <Card title="Mise à jour" href="/fr/install/updating" icon="arrow-up-right-from-square">
    Mise à jour du paquet OpenClaw et des services gérés.
  </Card>
</CardGroup>
