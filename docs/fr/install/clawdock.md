---
read_when:
    - Vous utilisez souvent OpenClaw avec Docker et souhaitez des commandes quotidiennes plus courtes
    - Vous souhaitez une couche d’assistance pour le tableau de bord, les journaux, la configuration des jetons et les processus d’appairage.
summary: Utilitaires shell ClawDock pour les installations d’OpenClaw basées sur Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T02:55:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock est une petite couche d’utilitaires shell pour les installations d’OpenClaw basées sur Docker.

Elle fournit des commandes courtes comme `clawdock-start`, `clawdock-dashboard` et `clawdock-fix-token`, au lieu d’invocations `docker compose ...` plus longues.

Si vous n’avez pas encore configuré Docker, commencez par [Docker](/fr/install/docker).

## Installation

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous aviez précédemment installé ClawDock depuis `scripts/shell-helpers/clawdock-helpers.sh`, réinstallez-le depuis le chemin actuel `scripts/clawdock/clawdock-helpers.sh` ; l’ancien chemin brut GitHub a été supprimé.

Lors de la première utilisation, les utilitaires détectent automatiquement votre copie de travail d’OpenClaw en vérifiant des chemins courants comme `~/openclaw` et `~/projects/openclaw`, puis mettent le résultat en cache dans `~/.clawdock/config`. Définissez vous-même `CLAWDOCK_DIR` si votre copie de travail se trouve ailleurs.

## Fonctionnalités disponibles

### Opérations de base

| Commande           | Description                         |
| ------------------ | ----------------------------------- |
| `clawdock-start`   | Démarrer le Gateway                 |
| `clawdock-stop`    | Arrêter le Gateway                  |
| `clawdock-restart` | Redémarrer le Gateway               |
| `clawdock-status`  | Vérifier l’état des conteneurs      |
| `clawdock-logs`    | Suivre les journaux du Gateway      |

### Accès au conteneur

| Commande                  | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `clawdock-shell`          | Ouvrir un shell dans le conteneur du Gateway          |
| `clawdock-cli <command>`  | Exécuter des commandes de la CLI OpenClaw dans Docker |
| `clawdock-exec <command>` | Exécuter une commande arbitraire dans le conteneur     |

### Interface Web et appairage

| Commande                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `clawdock-dashboard`    | Ouvrir l’URL de l’interface de contrôle      |
| `clawdock-devices`      | Répertorier les appairages d’appareils en attente |
| `clawdock-approve <id>` | Approuver une demande d’appairage            |

### Configuration et maintenance

| Commande             | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `clawdock-fix-token` | Écrire le jeton du Gateway dans la configuration du conteneur  |
| `clawdock-update`    | Récupérer, reconstruire et redémarrer                           |
| `clawdock-rebuild`   | Reconstruire uniquement l’image Docker                          |
| `clawdock-clean`     | Supprimer les conteneurs et les volumes                         |

### Utilitaires

| Commande               | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `clawdock-health`      | Exécuter une vérification de l’état du Gateway                 |
| `clawdock-token`       | Afficher le jeton du Gateway                                   |
| `clawdock-cd`          | Accéder au répertoire du projet OpenClaw                       |
| `clawdock-config`      | Ouvrir `~/.openclaw`                                           |
| `clawdock-show-config` | Afficher les fichiers de configuration avec les valeurs masquées |
| `clawdock-workspace`   | Ouvrir le répertoire de l’espace de travail                    |
| `clawdock-help`        | Répertorier toutes les commandes ClawDock                      |

## Première utilisation

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

ClawDock lit deux fichiers `.env` distincts, conformément à la séparation décrite dans [Docker](/fr/install/docker) :

- Le fichier `.env` du projet, à côté de `docker-compose.yml` : les valeurs propres à Docker, comme le nom de l’image, les ports et `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` lit le jeton depuis ce fichier.
- `~/.openclaw/.env` (monté dans le conteneur) : les secrets fournis par les variables d’environnement qu’OpenClaw gère lui-même, avec `openclaw.json` et `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` copie le jeton du fichier `.env` du projet dans les valeurs de configuration `gateway.remote.token` et `gateway.auth.token` du conteneur, puis redémarre le Gateway.

Utilisez `clawdock-show-config` pour consulter rapidement `openclaw.json` et les deux fichiers `.env` ; les valeurs des fichiers `.env` sont masquées dans la sortie affichée.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Docker" href="/fr/install/docker" icon="docker">
    Installation Docker canonique pour OpenClaw.
  </Card>
  <Card title="Environnement d’exécution de machine virtuelle Docker" href="/fr/install/docker-vm-runtime" icon="cube">
    Environnement d’exécution de machine virtuelle géré par Docker pour une isolation renforcée.
  </Card>
  <Card title="Mise à jour" href="/fr/install/updating" icon="arrow-up-right-from-square">
    Mise à jour du paquet OpenClaw et des services gérés.
  </Card>
</CardGroup>
