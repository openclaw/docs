---
read_when:
    - Vous voulez voir quelles Skills sont disponibles et prêtes à être exécutées
    - Vous souhaitez rechercher, installer ou mettre à jour des Skills depuis ClawHub
    - Vous voulez déboguer les binaires/env/config manquants pour les Skills
summary: Référence CLI pour `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T07:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspectez les Skills locaux et installez/mettez à jour des Skills depuis ClawHub.

Associé :

- Système Skills : [Skills](/fr/tools/skills)
- Configuration Skills : [Configuration Skills](/fr/tools/skills-config)
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
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` utilisent directement ClawHub et installent dans le répertoire `skills/` de l’espace de travail actif. `list`/`info`/`check` inspectent toujours les Skills locaux visibles pour l’espace de travail et la configuration actuels. Les commandes adossées à un espace de travail résolvent l’espace de travail cible à partir de `--agent <id>`, puis du répertoire de travail actuel lorsqu’il se trouve dans un espace de travail d’agent configuré, puis de l’agent par défaut.

Cette commande CLI `install` télécharge les dossiers de Skills depuis ClawHub. Les installations de dépendances de Skills adossées au Gateway et déclenchées depuis l’intégration initiale ou les paramètres Skills utilisent plutôt le chemin de requête `skills.install` séparé.

Remarques :

- `search [query...]` accepte une requête facultative ; omettez-la pour parcourir le flux de recherche ClawHub par défaut.
- `search --limit <n>` plafonne les résultats renvoyés.
- `install --force` écrase un dossier de Skill d’espace de travail existant pour le même slug.
- `--agent <id>` cible un espace de travail d’agent configuré et remplace l’inférence à partir du répertoire de travail actuel.
- `update --all` met uniquement à jour les installations ClawHub suivies dans l’espace de travail actif.
- `list` est l’action par défaut lorsqu’aucune sous-commande n’est fournie.
- `list`, `info` et `check` écrivent leur sortie rendue sur stdout. Avec `--json`, cela signifie que la charge utile lisible par machine reste sur stdout pour les pipes et les scripts.

## Associé

- [Référence CLI](/fr/cli)
- [Skills](/fr/tools/skills)
