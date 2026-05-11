---
read_when:
    - Vous voulez voir les Skills disponibles et prêtes à être exécutées
    - Vous voulez rechercher, installer ou mettre à jour des Skills depuis ClawHub
    - Vous souhaitez déboguer des binaires, un environnement ou une configuration manquants pour les Skills
summary: Référence CLI pour `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-11T20:29:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecter les Skills locales et installer/mettre à jour des Skills depuis ClawHub.

Rubriques connexes :

- Système Skills : [Skills](/fr/tools/skills)
- Configuration Skills : [Configuration Skills](/fr/tools/skills-config)
- Installations ClawHub : [ClawHub](/fr/clawhub/cli)

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

`search`/`install`/`update` utilisent directement ClawHub et installent dans le
répertoire `skills/` de l’espace de travail actif. `list`/`info`/`check`
inspectent toujours les Skills locales visibles par l’espace de travail et la
configuration actuels. Les commandes adossées à l’espace de travail résolvent
l’espace de travail cible à partir de `--agent <id>`, puis du répertoire de
travail actuel lorsqu’il se trouve dans un espace de travail d’agent configuré,
puis de l’agent par défaut.

Cette commande CLI `install` télécharge les dossiers de Skills depuis ClawHub.
Les installations de dépendances de Skills adossées au Gateway, déclenchées
depuis l’intégration ou les paramètres Skills, utilisent à la place le chemin de
requête `skills.install` distinct.

Remarques :

- `search [query...]` accepte une requête facultative ; omettez-la pour parcourir
  le flux de recherche ClawHub par défaut.
- `search --limit <n>` limite le nombre de résultats renvoyés.
- `install --force` écrase un dossier de Skill existant dans l’espace de travail
  pour le même slug.
- `--agent <id>` cible un espace de travail d’agent configuré et remplace
  l’inférence à partir du répertoire de travail actuel.
- `update --all` met uniquement à jour les installations ClawHub suivies dans
  l’espace de travail actif.
- `check --agent <id>` vérifie l’espace de travail de l’agent sélectionné et
  indique quelles Skills prêtes sont réellement visibles dans le prompt ou la
  surface de commande de cet agent.
- `list` est l’action par défaut lorsqu’aucune sous-commande n’est fournie.
- `list`, `info` et `check` écrivent leur sortie rendue vers stdout. Avec
  `--json`, cela signifie que la charge utile lisible par machine reste sur
  stdout pour les pipes et les scripts.

## Connexe

- [Référence CLI](/fr/cli)
- [Skills](/fr/tools/skills)
