---
read_when:
    - Première utilisation de ClawHub
    - Installer un skill ou Plugin depuis le registre
    - Publication sur ClawHub
summary: 'Commencez à utiliser ClawHub : recherchez, installez, mettez à jour et publiez des Skills ou des Plugins.'
x-i18n:
    generated_at: "2026-07-01T08:01:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Démarrage rapide

ClawHub est un registre pour les skills et les plugins OpenClaw.

Utilisez OpenClaw lorsque vous installez des éléments dans OpenClaw. Utilisez la CLI `clawhub`
lorsque vous vous connectez, publiez, gérez vos propres fiches ou utilisez des
workflows propres au registre.

## Trouver et installer un skill

Rechercher depuis OpenClaw :

```bash
openclaw skills search "calendar"
```

Installer un skill :

```bash
openclaw skills install @openclaw/demo
```

Mettre à jour les skills installés :

```bash
openclaw skills update --all
```

OpenClaw enregistre la provenance du skill afin que les mises à jour ultérieures puissent continuer à se
résoudre via ClawHub.

## Trouver et installer un plugin

Rechercher depuis OpenClaw :

```bash
openclaw plugins search "calendar"
```

Installer un plugin hébergé par ClawHub avec une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

Mettre à jour les plugins installés :

```bash
openclaw plugins update --all
```

Utilisez le préfixe `clawhub:` lorsque vous voulez qu’OpenClaw résolve le package via
ClawHub plutôt que via npm ou une autre source.

## Se connecter pour publier

Installer la CLI ClawHub :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Se connecter avec GitHub :

```bash
clawhub login
clawhub whoami
```

Les environnements sans interface peuvent utiliser un jeton d’API depuis l’interface web de ClawHub :

```bash
clawhub login --token clh_...
```

## Publier un skill

Un skill est un dossier contenant un fichier `SKILL.md` obligatoire et des fichiers de support
facultatifs.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

La commande ignore le contenu inchangé. Les nouveaux skills commencent à `1.0.0` ; les modifications ultérieures
publient automatiquement la version corrective suivante. Utilisez `--dry-run` pour prévisualiser ou
`--version` pour choisir une version explicite.

Avant de publier, vérifiez les métadonnées dans `SKILL.md`. Déclarez les variables
d’environnement, les outils et les autorisations requis afin que les utilisateurs puissent comprendre ce dont le
skill a besoin avant de l’installer. Consultez [Format des skills](/fr/clawhub/skill-format).

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

Utilisez d’abord `--dry-run` pour prévisualiser les métadonnées du package résolu, les champs de compatibilité, l’attribution de la source et le plan d’envoi sans publier.

Les plugins de code doivent inclure des métadonnées de compatibilité OpenClaw dans `package.json`,
notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.

## Inspecter avant l’installation

Avant l’installation, utilisez la page web ClawHub ou les commandes de détail de la CLI pour inspecter
les métadonnées, les liens sources, les versions, les journaux des modifications et l’état de l’analyse :

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Les fiches publiques affichent le dernier état de l’analyse. Les versions retenues ou bloquées par
la modération peuvent être masquées des surfaces de recherche et d’installation jusqu’à résolution.
