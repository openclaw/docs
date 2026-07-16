---
read_when:
    - Première utilisation de ClawHub
    - Installation d’une Skill ou d’un Plugin depuis le registre
    - Publication sur ClawHub
summary: 'Commencez à utiliser ClawHub : recherchez, installez, mettez à jour et publiez des Skills ou des plugins.'
x-i18n:
    generated_at: "2026-07-16T13:07:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Démarrage rapide

ClawHub est un registre de Skills et de plugins pour OpenClaw.

Utilisez OpenClaw lorsque vous installez des éléments dans OpenClaw. Utilisez la CLI `clawhub`
lorsque vous vous connectez, publiez, gérez vos propres fiches ou utilisez
des workflows propres au registre.

## Rechercher et installer une Skill

Effectuez une recherche depuis OpenClaw :

```bash
openclaw skills search "calendar"
```

Installez une Skill :

```bash
openclaw skills install @openclaw/demo
```

Mettez à jour les Skills installées :

```bash
openclaw skills update --all
```

OpenClaw enregistre la provenance de la Skill afin que les mises à jour ultérieures puissent continuer à
être résolues via ClawHub.

## Rechercher et installer un plugin

Effectuez une recherche depuis OpenClaw :

```bash
openclaw plugins search "calendar"
```

Installez un plugin hébergé sur ClawHub en spécifiant explicitement ClawHub comme source :

```bash
openclaw plugins install clawhub:<package>
```

Mettez à jour les plugins installés :

```bash
openclaw plugins update --all
```

Utilisez le préfixe `clawhub:` lorsque vous souhaitez qu’OpenClaw résolve le paquet via
ClawHub plutôt que via npm ou une autre source.

## Se connecter pour publier

Installez la CLI ClawHub :

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

Connectez-vous avec GitHub :

```bash
clawhub login
clawhub whoami
```

Les environnements sans interface graphique peuvent utiliser un jeton d’API provenant de l’interface web de ClawHub :

```bash
clawhub login --token clh_...
```

## Publier une Skill

Une Skill est un dossier contenant obligatoirement un fichier `SKILL.md` et éventuellement des fichiers
complémentaires.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

La commande ignore le contenu inchangé. Les nouvelles Skills commencent à la version `1.0.0` ; les modifications ultérieures
publient automatiquement la version corrective suivante. Utilisez `--dry-run` pour afficher un aperçu ou
`--version` pour choisir une version explicite.

Avant de publier, vérifiez les métadonnées dans `SKILL.md`. Déclarez les
variables d’environnement, les outils et les autorisations requis afin que les utilisateurs puissent comprendre les besoins de la
Skill avant de l’installer. Consultez [Format des Skills](/fr/clawhub/skill-format).

Pour les dépôts contenant plusieurs Skills, le workflow GitHub réutilisable appelle
`skill publish` pour chaque dossier de Skill directement situé sous `skills/` :

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

Utilisez d’abord `--dry-run` pour afficher un aperçu des métadonnées résolues du paquet, des champs de
compatibilité, de l’attribution de la source et du plan de téléversement sans publier.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw dans `package.json`,
notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.

## Inspecter avant l’installation

Avant l’installation, utilisez la page web de ClawHub ou les commandes détaillées de la CLI pour examiner
les métadonnées, les liens vers les sources, les versions, les journaux des modifications et l’état de l’analyse :

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Les fiches publiques affichent le dernier état d’analyse. Les versions retenues ou bloquées par
la modération peuvent être masquées dans les interfaces de recherche et d’installation jusqu’à la résolution du problème.
