---
read_when:
    - Première utilisation de ClawHub
    - Installation d’une skill ou d’un plugin depuis le registre
    - Publication sur ClawHub
summary: 'Commencez à utiliser ClawHub : recherchez, installez, mettez à jour et publiez des Skills ou des plugins.'
x-i18n:
    generated_at: "2026-07-03T09:32:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Démarrage rapide

ClawHub est un registre pour les skills et plugins OpenClaw.

Utilisez OpenClaw lorsque vous installez des éléments dans OpenClaw. Utilisez la CLI `clawhub`
lorsque vous vous connectez, publiez, gérez vos propres fiches ou utilisez des
workflows propres au registre.

## Rechercher et installer un skill

Recherchez depuis OpenClaw :

```bash
openclaw skills search "calendar"
```

Installez un skill :

```bash
openclaw skills install @openclaw/demo
```

Mettez à jour les skills installés :

```bash
openclaw skills update --all
```

OpenClaw enregistre l’origine du skill afin que les mises à jour ultérieures puissent continuer à
être résolues via ClawHub.

## Rechercher et installer un plugin

Recherchez depuis OpenClaw :

```bash
openclaw plugins search "calendar"
```

Installez un plugin hébergé sur ClawHub avec une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

Mettez à jour les plugins installés :

```bash
openclaw plugins update --all
```

Utilisez le préfixe `clawhub:` lorsque vous voulez qu’OpenClaw résolve le package via
ClawHub plutôt que npm ou une autre source.

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

Les environnements sans interface graphique peuvent utiliser un jeton d’API depuis l’interface web de ClawHub :

```bash
clawhub login --token clh_...
```

## Publier un skill

Un skill est un dossier avec un fichier `SKILL.md` obligatoire et des fichiers de prise en charge
facultatifs.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

La commande ignore le contenu inchangé. Les nouveaux skills commencent à `1.0.0`; les changements ultérieurs
publient automatiquement la version corrective suivante. Utilisez `--dry-run` pour prévisualiser ou
`--version` pour choisir une version explicite.

Avant de publier, vérifiez les métadonnées dans `SKILL.md`. Déclarez les
variables d’environnement, outils et permissions requis afin que les utilisateurs puissent comprendre ce dont le
skill a besoin avant de l’installer. Consultez [Format de skill](/fr/clawhub/skill-format).

Pour les dépôts contenant plusieurs skills, le workflow GitHub réutilisable appelle
`skill publish` pour chaque dossier de skill immédiat sous `skills/` :

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publier un plugin

Publiez un plugin depuis un dossier local, un dépôt GitHub, une référence GitHub ou une
archive existante :

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez d’abord `--dry-run` pour prévisualiser les métadonnées de package résolues, les champs de
compatibilité, l’attribution de la source et le plan de téléversement sans publier.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw dans `package.json`,
notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.

## Inspecter avant l’installation

Avant l’installation, utilisez la page web ClawHub ou les commandes de détail de la CLI pour inspecter
les métadonnées, les liens source, les versions, les journaux des changements et l’état d’analyse :

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Les fiches publiques affichent le dernier état d’analyse. Les versions retenues ou bloquées par
la modération peuvent être masquées des surfaces de recherche et d’installation jusqu’à leur résolution.
