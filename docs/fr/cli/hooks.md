---
read_when:
    - Vous souhaitez gérer les hooks des agents
    - Vous souhaitez vérifier la disponibilité des hooks ou activer les hooks de l’espace de travail
summary: Référence de la CLI pour `openclaw hooks` (hooks d’agent)
title: Hooks
x-i18n:
    generated_at: "2026-07-12T02:26:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gérez les hooks d’agent (automatisations pilotées par des événements pour des commandes comme `/new`, `/reset` et le démarrage du Gateway). La commande seule `openclaw hooks` équivaut à `openclaw hooks list`.

Voir aussi : [Hooks](/fr/automation/hooks) - [Hooks de Plugin](/fr/plugins/hooks)

## Répertorier les hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Répertorie les hooks détectés dans les répertoires de l’espace de travail, gérés, supplémentaires et intégrés.

- `--eligible` : uniquement les hooks dont les prérequis sont satisfaits.
- `--json` : sortie structurée.
- `-v, --verbose` : inclut une colonne Missing indiquant les prérequis non satisfaits.

```
Hooks (4/5 prêts)

Prêts :
  🚀 boot-md ✓ - Exécuter BOOT.md au démarrage du Gateway
  📎 bootstrap-extra-files ✓ - Injecter des fichiers d’amorçage supplémentaires de l’espace de travail pendant l’amorçage de l’agent
  📝 command-logger ✓ - Consigner tous les événements de commande dans un fichier d’audit centralisé
  💾 session-memory ✓ - Enregistrer le contexte de session en mémoire lors de l’émission de la commande /new ou /reset
```

## Obtenir les informations d’un hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` est le nom ou la clé du hook (par exemple `session-memory`). Affiche la source, les chemins du fichier et du gestionnaire, la page d’accueil, les événements et l’état de chaque prérequis (fichiers binaires, environnement, configuration, système d’exploitation).

## Vérifier l’éligibilité

```bash
openclaw hooks check [--json]
```

Affiche un récapitulatif du nombre de hooks prêts et non prêts ; si certains hooks ne sont pas prêts, les répertorie avec la raison de leur blocage.

## Activer un hook

```bash
openclaw hooks enable <name>
```

Ajoute ou met à jour `hooks.internal.entries.<name>.enabled = true` dans la configuration et active également l’interrupteur principal `hooks.internal.enabled` (le Gateway ne charge aucun gestionnaire de hook interne tant qu’au moins un n’est pas configuré). Échoue si le hook n’existe pas, est géré par un Plugin ou n’est pas éligible (prérequis manquants).

Les hooks gérés par un Plugin affichent `plugin:<id>` dans `hooks list` et ne peuvent pas être activés ou désactivés ici ; activez ou désactivez plutôt le Plugin propriétaire.

Redémarrez le Gateway après l’activation (redémarrez l’application de la barre des menus macOS ou votre processus Gateway en environnement de développement) afin qu’il recharge les hooks.

## Désactiver un hook

```bash
openclaw hooks disable <name>
```

Définit `hooks.internal.entries.<name>.enabled = false`. Redémarrez ensuite le Gateway.

## Installer et mettre à jour les packs de hooks

```bash
openclaw plugins install <package>        # npm par défaut
openclaw plugins install npm:<package>    # npm uniquement
openclaw plugins install <package> --pin  # épingler la version résolue
openclaw plugins install <path>           # répertoire local ou archive
openclaw plugins install -l <path>        # lier un répertoire local au lieu de le copier

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Les packs de hooks s’installent au moyen du programme unifié d’installation et de mise à jour des plugins ; `openclaw hooks install` et `openclaw hooks update` continuent de fonctionner comme alias obsolètes qui affichent un avertissement et transmettent l’appel aux commandes `plugins`.

- Les spécifications npm sont limitées au registre : un nom de paquet accompagné éventuellement d’une version exacte ou d’un dist-tag. Les spécifications Git, URL ou fichier ainsi que les plages semver sont rejetées. L’installation des dépendances s’exécute localement dans le projet avec `--ignore-scripts`.
- Les spécifications seules et `@latest` restent sur le canal stable ; si npm résout une préversion, OpenClaw s’arrête et vous demande de l’accepter explicitement (`@beta`, `@rc` ou une version préliminaire exacte).
- Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` lie un répertoire local au lieu de le copier (en l’ajoutant à `hooks.internal.load.extraDirs`) ; les packs de hooks liés sont des hooks gérés provenant d’un répertoire configuré par un opérateur, et non des hooks de l’espace de travail.
- `--pin` enregistre les installations npm sous la forme exacte `name@version` résolue dans `hooks.internal.installs`.
- L’installation copie le pack dans `~/.openclaw/hooks/<id>`, active ses hooks sous `hooks.internal.entries.*` et enregistre l’installation sous `hooks.internal.installs`.
- Si un hachage d’intégrité enregistré ne correspond plus à l’artefact récupéré, OpenClaw affiche un avertissement et demande confirmation avant de poursuivre ; transmettez l’option globale `--yes` pour ignorer cette demande (par exemple dans un environnement CI).

## Hooks intégrés

| Hook                  | Événements                                        | Fonction                                                                                                   |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Exécute `BOOT.md` au démarrage du Gateway pour chaque portée d’agent configurée                            |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injecte des fichiers d’amorçage supplémentaires (par exemple `AGENTS.md`/`TOOLS.md` d’un monorepo) pendant l’amorçage de l’agent |
| command-logger        | `command`                                         | Consigne les événements de commande dans `~/.openclaw/logs/commands.log`                                   |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envoie des notifications visibles dans la discussion au début et à la fin de la Compaction de la session  |
| session-memory        | `command:new`, `command:reset`                    | Enregistre le contexte de session en mémoire lors de `/new` ou `/reset`                                    |

Activez n’importe quel hook intégré avec `openclaw hooks enable <hook-name>`. Pour obtenir tous les détails, les clés de configuration et les valeurs par défaut, consultez : [Hooks intégrés](/fr/automation/hooks#bundled-hooks).

### Fichier journal de command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # commandes récentes
cat ~/.openclaw/logs/commands.log | jq .          # affichage lisible
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtrer par action
```

## Remarques

- `hooks list --json`, `info --json` et `check --json` écrivent directement des données JSON structurées dans la sortie standard.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Hooks d’automatisation](/fr/automation/hooks)
