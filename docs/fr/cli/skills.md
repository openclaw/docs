---
read_when:
    - Vous voulez voir les Skills disponibles et prêtes à être exécutées
    - Vous voulez rechercher, installer ou mettre à jour des Skills depuis ClawHub
    - Vous voulez déboguer des binaires, des variables d’environnement ou une configuration manquants pour les Skills
summary: Référence de la CLI pour `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecter les Skills locaux et installer/mettre à jour des Skills depuis ClawHub.

Connexe :

- Système Skills : [Skills](/fr/tools/skills)
- Configuration des Skills : [Configuration des Skills](/fr/tools/skills-config)
- Installations ClawHub : [ClawHub](/fr/tools/clawhub)

## Commandes

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` utilisent ClawHub directement et installent dans le répertoire `skills/` de l’espace de travail actif. `list`/`info`/`check` inspectent toujours les Skills locaux visibles pour l’espace de travail et la configuration actuels. Les commandes adossées à l’espace de travail résolvent l’espace de travail cible à partir de `--agent <id>`, puis du répertoire de travail courant lorsqu’il se trouve dans un espace de travail d’agent configuré, puis de l’agent par défaut.

Cette commande CLI `install` télécharge les dossiers de Skills depuis ClawHub. Les installations de dépendances de Skills adossées au Gateway, déclenchées depuis l’intégration ou les paramètres Skills, utilisent à la place le chemin de requête `skills.install` distinct.

Remarques :

- `search [query...]` accepte une requête facultative ; omettez-la pour parcourir le flux de recherche ClawHub par défaut.
- `search --limit <n>` limite les résultats renvoyés.
- `install --force` remplace un dossier de Skill d’espace de travail existant pour le même slug.
- `--agent <id>` cible un espace de travail d’agent configuré et remplace l’inférence à partir du répertoire de travail courant.
- `update --all` met uniquement à jour les installations ClawHub suivies dans l’espace de travail actif.
- `check --agent <id>` vérifie l’espace de travail de l’agent sélectionné et indique quels Skills prêts sont réellement visibles dans le prompt ou la surface de commande de cet agent.
- `list` est l’action par défaut lorsqu’aucune sous-commande n’est fournie.
- `list`, `info` et `check` écrivent leur sortie rendue sur stdout. Avec `--json`, cela signifie que la charge utile lisible par machine reste sur stdout pour les tubes et les scripts.

## Connexe

- [Référence CLI](/fr/cli)
- [Skills](/fr/tools/skills)
