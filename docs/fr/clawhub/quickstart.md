---
read_when:
    - Première utilisation de ClawHub
    - Installation d’une compétence ou d’un Plugin depuis le registre
    - Publication sur ClawHub
summary: 'Commencez à utiliser ClawHub : trouvez, installez, mettez à jour et publiez des Skills ou des plugins.'
x-i18n:
    generated_at: "2026-05-13T02:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Démarrage rapide

ClawHub est un registre pour les skills et plugins OpenClaw.

Utilisez OpenClaw lorsque vous installez des éléments dans OpenClaw. Utilisez la CLI `clawhub`
lorsque vous vous connectez, publiez, gérez vos propres listings ou utilisez
des workflows propres au registre.

## Trouver et installer un skill

Rechercher depuis OpenClaw :

```bash
openclaw skills search "calendar"
```

Installer un skill :

```bash
openclaw skills install <skill-slug>
```

Mettre à jour les skills installés :

```bash
openclaw skills update --all
```

OpenClaw enregistre la provenance du skill afin que les mises à jour ultérieures puissent continuer à
se résoudre via ClawHub.

## Trouver et installer un plugin

Rechercher depuis OpenClaw :

```bash
openclaw plugins search "calendar"
```

Installer un plugin hébergé sur ClawHub avec une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

Mettre à jour les plugins installés :

```bash
openclaw plugins update --all
```

Utilisez le préfixe `clawhub:` lorsque vous voulez qu’OpenClaw résolve le package via
ClawHub plutôt que npm ou une autre source.

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

Un skill est un dossier avec un fichier `SKILL.md` obligatoire et des fichiers de support
facultatifs.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Avant de publier, vérifiez les métadonnées dans `SKILL.md`. Déclarez les variables
d’environnement, outils et permissions requis afin que les utilisateurs puissent comprendre ce dont le
skill a besoin avant de l’installer. Consultez [Format des skills](/fr/clawhub/skill-format).

## Publier un plugin

Publiez un plugin depuis un dossier local, un dépôt GitHub, une ref GitHub ou une
archive existante :

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez d’abord `--dry-run` pour prévisualiser les métadonnées de package résolues, les champs de compatibilité,
l’attribution de source et le plan d’envoi sans publier.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw dans `package.json`,
notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.

## Synchroniser les skills que vous maintenez

`sync` analyse les dossiers de skills et publie les skills nouveaux ou modifiés qui ne sont pas
déjà synchronisés.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Lorsque vous êtes connecté, `sync` peut également envoyer un instantané d’installation minimal pour
les statistiques agrégées d’installation. Consultez [Télémétrie](/fr/clawhub/telemetry) pour savoir ce qui est signalé
et comment vous désinscrire.

## Inspecter avant l’installation

Avant d’installer, utilisez la page web ClawHub ou les commandes de détail de la CLI pour inspecter
les métadonnées, les liens vers les sources, les versions, les journaux des modifications et l’état de l’analyse :

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Les listings publics affichent le dernier état d’analyse. Les releases retenues ou bloquées par
la modération peuvent être masquées des surfaces de recherche et d’installation jusqu’à résolution.
