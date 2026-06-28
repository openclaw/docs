---
read_when:
    - Première utilisation de ClawHub
    - Installer une Skill ou un Plugin depuis le registre
    - Publication sur ClawHub
summary: 'Commencez à utiliser ClawHub : trouvez, installez, mettez à jour et publiez des Skills ou des plugins.'
x-i18n:
    generated_at: "2026-06-28T05:07:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Démarrage rapide

ClawHub est un registre pour les Skills et Plugins OpenClaw.

Utilisez OpenClaw lorsque vous installez des éléments dans OpenClaw. Utilisez la CLI `clawhub`
lorsque vous vous connectez, publiez, gérez vos propres listings ou utilisez des
workflows propres au registre.

## Rechercher et installer une Skill

Rechercher depuis OpenClaw :

```bash
openclaw skills search "calendar"
```

Installer une Skill :

```bash
openclaw skills install @openclaw/demo
```

Mettre à jour les Skills installées :

```bash
openclaw skills update --all
```

OpenClaw enregistre la provenance de la Skill afin que les mises à jour ultérieures puissent continuer à
être résolues via ClawHub.

## Rechercher et installer un Plugin

Rechercher depuis OpenClaw :

```bash
openclaw plugins search "calendar"
```

Installer un Plugin hébergé par ClawHub avec une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

Mettre à jour les Plugins installés :

```bash
openclaw plugins update --all
```

Utilisez le préfixe `clawhub:` lorsque vous voulez qu’OpenClaw résolve le paquet via
ClawHub plutôt que via npm ou une autre source.

## Se connecter pour publier

Installez la CLI ClawHub :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Connectez-vous avec GitHub :

```bash
clawhub login
clawhub whoami
```

Les environnements sans interface peuvent utiliser un jeton d’API depuis l’interface web ClawHub :

```bash
clawhub login --token clh_...
```

## Publier une Skill

Une Skill est un dossier avec un fichier `SKILL.md` obligatoire et des fichiers de support
facultatifs.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

La commande ignore le contenu inchangé. Les nouvelles Skills commencent à `1.0.0` ; les changements ultérieurs
publient automatiquement la version corrective suivante. Utilisez `--dry-run` pour prévisualiser ou
`--version` pour choisir une version explicite.

Avant de publier, vérifiez les métadonnées dans `SKILL.md`. Déclarez les variables
d’environnement, outils et autorisations requis afin que les utilisateurs puissent comprendre ce dont la
Skill a besoin avant de l’installer. Consultez [Format de Skill](/fr/clawhub/skill-format).

Pour les dépôts contenant plusieurs Skills, le workflow GitHub réutilisable appelle
`skill publish` pour chaque dossier Skill immédiat sous `skills/` :

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publier un Plugin

Publier un Plugin depuis un dossier local, un dépôt GitHub, une référence GitHub ou une
archive existante :

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez d’abord `--dry-run` pour prévisualiser les métadonnées du paquet résolu, les champs de compatibilité,
l’attribution de la source et le plan de téléversement sans publier.

Les Plugins de code doivent inclure des métadonnées de compatibilité OpenClaw dans `package.json`,
notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.

## Inspecter avant l’installation

Avant d’installer, utilisez la page web ClawHub ou les commandes de détail de la CLI pour inspecter
les métadonnées, les liens source, les versions, les journaux des modifications et l’état de l’analyse :

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Les listings publics affichent le dernier état de l’analyse. Les versions retenues ou bloquées par
la modération peuvent être masquées des surfaces de recherche et d’installation jusqu’à résolution.
