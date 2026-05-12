---
read_when:
    - Première utilisation de ClawHub
    - Installation d’un Skill ou d’un Plugin depuis le registre
    - Publication sur ClawHub
summary: 'Commencez à utiliser ClawHub : trouvez, installez, mettez à jour et publiez des Skills ou des plugins.'
x-i18n:
    generated_at: "2026-05-12T12:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Démarrage rapide

ClawHub est un registre pour les skills et plugins OpenClaw.

Utilisez OpenClaw lorsque vous installez des éléments dans OpenClaw. Utilisez la CLI `clawhub`
lorsque vous vous connectez, publiez, gérez vos propres listings ou utilisez des
workflows propres au registre.

## Rechercher et installer une skill

Recherchez depuis OpenClaw :

```bash
openclaw skills search "calendar"
```

Installez une skill :

```bash
openclaw skills install <skill-slug>
```

Mettez à jour les skills installées :

```bash
openclaw skills update --all
```

OpenClaw enregistre la provenance de la skill afin que les mises à jour ultérieures puissent continuer à
être résolues via ClawHub.

## Rechercher et installer un plugin

Recherchez depuis OpenClaw :

```bash
openclaw plugins search "calendar"
```

Installez un plugin hébergé par ClawHub avec une source ClawHub explicite :

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

Les environnements sans interface peuvent utiliser un jeton d’API depuis l’interface web ClawHub :

```bash
clawhub login --token clh_...
```

## Publier une skill

Une skill est un dossier avec un fichier `SKILL.md` obligatoire et des fichiers de support
facultatifs.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Avant de publier, vérifiez les métadonnées dans `SKILL.md`. Déclarez les variables
d’environnement, outils et autorisations requis afin que les utilisateurs comprennent ce dont la
skill a besoin avant de l’installer. Consultez [Format de skill](/fr/clawhub/skill-format).

## Publier un plugin

Publiez un plugin depuis un dossier local, un dépôt GitHub, une référence GitHub ou une
archive existante :

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez d’abord `--dry-run` pour prévisualiser les métadonnées du package résolu, les champs
de compatibilité, l’attribution de la source et le plan de téléversement sans publier.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw dans `package.json`,
y compris `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.

## Synchroniser les skills que vous maintenez

`sync` analyse les dossiers de skills et publie les skills nouvelles ou modifiées qui ne sont pas
déjà synchronisées.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Lorsque vous êtes connecté, `sync` peut également envoyer un instantané minimal des installations pour
les décomptes d’installations agrégés. Consultez [Télémétrie](/fr/clawhub/telemetry) pour savoir ce qui est signalé
et comment vous désinscrire.

## Inspecter avant l’installation

Avant l’installation, utilisez la page web ClawHub ou les commandes de détail de la CLI pour inspecter
les métadonnées, les liens source, les versions, les journaux de modifications et l’état d’analyse :

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Les listings publics affichent le dernier état d’analyse. Les versions retenues ou bloquées par
la modération peuvent être masquées des surfaces de recherche et d’installation jusqu’à leur résolution.
