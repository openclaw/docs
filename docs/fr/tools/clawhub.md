---
read_when:
    - Présentation de ClawHub aux nouveaux utilisateurs
    - Installation, recherche ou publication de Skills ou de plugins
    - Explication des drapeaux CLI ClawHub et du comportement de synchronisation
summary: 'Guide ClawHub : registre public, flux d’installation natifs OpenClaw et flux de travail de la CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub est le registre public des **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher/installer/mettre à jour des Skills et installer
  des plugins depuis ClawHub.
- Utilisez la CLI séparée `clawhub` lorsque vous avez besoin de l’authentification au registre, de publier, supprimer,
  restaurer, ou de flux de travail de synchronisation.

Site : [clawhub.ai](https://clawhub.ai)

## Flux natifs OpenClaw

Skills :

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins :

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Les spécifications de plugin brutes compatibles npm sont aussi essayées sur ClawHub avant npm :

```bash
openclaw plugins install openclaw-codex-app-server
```

Les commandes natives `openclaw` installent dans votre espace de travail actif et conservent les
métadonnées de source afin que les appels ultérieurs à `update` puissent rester sur ClawHub.

Les installations de plugin valident la compatibilité annoncée de `pluginApi` et
`minGatewayVersion` avant l’exécution de l’installation de l’archive, afin que les hôtes incompatibles
échouent en mode fermé dès le début au lieu d’installer partiellement le package.

`openclaw plugins install clawhub:...` n’accepte que les familles de plugins installables.
Si un package ClawHub est en réalité un Skills, OpenClaw s’arrête et vous redirige vers
`openclaw skills install <slug>` à la place.

## Ce qu’est ClawHub

- Un registre public pour les Skills et plugins OpenClaw.
- Un magasin versionné de bundles de Skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’usage.

## Fonctionnement

1. Un utilisateur publie un bundle de Skills (fichiers + métadonnées).
2. ClawHub stocke le bundle, analyse les métadonnées et assigne une version.
3. Le registre indexe le Skills pour la recherche et la découverte.
4. Les utilisateurs parcourent, téléchargent et installent des Skills dans OpenClaw.

## Ce que vous pouvez faire

- Publier de nouveaux Skills et de nouvelles versions de Skills existants.
- Découvrir des Skills par nom, tags ou recherche.
- Télécharger des bundles de Skills et inspecter leurs fichiers.
- Signaler des Skills abusifs ou dangereux.
- Si vous êtes modérateur, masquer, afficher, supprimer ou bannir.

## À qui cela s’adresse (adapté aux débutants)

Si vous voulez ajouter de nouvelles capacités à votre agent OpenClaw, ClawHub est le moyen le plus simple de trouver et d’installer des Skills. Vous n’avez pas besoin de connaître le fonctionnement du backend. Vous pouvez :

- Rechercher des Skills en langage naturel.
- Installer un Skills dans votre espace de travail.
- Mettre à jour les Skills plus tard avec une seule commande.
- Sauvegarder vos propres Skills en les publiant.

## Démarrage rapide (non technique)

1. Recherchez ce dont vous avez besoin :
   - `openclaw skills search "calendar"`
2. Installez un Skills :
   - `openclaw skills install <skill-slug>`
3. Démarrez une nouvelle session OpenClaw pour qu’il prenne en compte le nouveau Skills.
4. Si vous voulez publier ou gérer l’authentification au registre, installez aussi la
   CLI séparée `clawhub`.

## Installer la CLI ClawHub

Vous n’en avez besoin que pour les flux de travail authentifiés auprès du registre, comme publier/synchroniser :

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Comment cela s’intègre à OpenClaw

La commande native `openclaw skills install` installe dans le répertoire `skills/`
de l’espace de travail actif. `openclaw plugins install clawhub:...` enregistre une installation
de plugin gérée normale ainsi que les métadonnées de source ClawHub pour les mises à jour.

Les installations anonymes de plugins ClawHub échouent aussi en mode fermé pour les packages privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours installer, mais OpenClaw avertit
afin que les opérateurs puissent examiner la source et la vérification avant l’activation.

La CLI séparée `clawhub` installe aussi les Skills dans `./skills` sous votre
répertoire de travail actuel. Si un espace de travail OpenClaw est configuré, `clawhub`
revient à cet espace de travail sauf si vous remplacez avec `--workdir` (ou
`CLAWHUB_WORKDIR`). OpenClaw charge les Skills d’espace de travail depuis `<workspace>/skills`
et les prendra en compte dans la **prochaine** session. Si vous utilisez déjà
`~/.openclaw/skills` ou des Skills intégrés, les Skills d’espace de travail sont prioritaires.

Pour plus de détails sur la façon dont les Skills sont chargés, partagés et contrôlés, consultez
[Skills](/fr/tools/skills).

## Vue d’ensemble du système de Skills

Un Skills est un bundle versionné de fichiers qui apprend à OpenClaw comment effectuer une
tâche spécifique. Chaque publication crée une nouvelle version, et le registre conserve un
historique des versions afin que les utilisateurs puissent auditer les changements.

Un Skills typique comprend :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par le Skills.
- Des métadonnées telles que les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en toute sécurité les capacités des Skills.
Le registre suit aussi les signaux d’usage (tels que les étoiles et téléchargements) pour améliorer
le classement et la visibilité.

## Ce que le service fournit (fonctionnalités)

- **Navigation publique** des Skills et de leur contenu `SKILL.md`.
- **Recherche** alimentée par des embeddings (recherche vectorielle), et pas seulement par mots-clés.
- **Versionnement** avec semver, changelogs et tags (y compris `latest`).
- **Téléchargements** sous forme de zip par version.
- **Étoiles et commentaires** pour les retours de la communauté.
- **Hooks** de modération pour les approbations et audits.
- **API adaptée à la CLI** pour l’automatisation et les scripts.

## Sécurité et modération

ClawHub est ouvert par défaut. Tout le monde peut téléverser des Skills, mais un compte GitHub doit
avoir au moins une semaine pour publier. Cela aide à ralentir les abus sans bloquer
les contributeurs légitimes.

Signalement et modération :

- Tout utilisateur connecté peut signaler un Skills.
- Les raisons de signalement sont obligatoires et enregistrées.
- Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
- Les Skills avec plus de 3 signalements uniques sont automatiquement masqués par défaut.
- Les modérateurs peuvent voir les Skills masqués, les réafficher, les supprimer ou bannir des utilisateurs.
- Abuser de la fonctionnalité de signalement peut entraîner des bannissements de compte.

Vous souhaitez devenir modérateur ? Demandez sur le Discord OpenClaw et contactez un
modérateur ou un mainteneur.

## Commandes et paramètres CLI

Options globales (s’appliquent à toutes les commandes) :

- `--workdir <dir>` : répertoire de travail (par défaut : répertoire courant ; revient à l’espace de travail OpenClaw).
- `--dir <dir>` : répertoire Skills, relatif au répertoire de travail (par défaut : `skills`).
- `--site <url>` : URL de base du site (connexion navigateur).
- `--registry <url>` : URL de base de l’API du registre.
- `--no-input` : désactiver les invites (non interactif).
- `-V, --cli-version` : afficher la version de la CLI.

Authentification :

- `clawhub login` (flux navigateur) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Options :

- `--token <token>` : coller un jeton API.
- `--label <label>` : libellé stocké pour les jetons de connexion navigateur (par défaut : `CLI token`).
- `--no-browser` : ne pas ouvrir de navigateur (nécessite `--token`).

Recherche :

- `clawhub search "query"`
- `--limit <n>` : nombre maximal de résultats.

Installation :

- `clawhub install <slug>`
- `--version <version>` : installer une version spécifique.
- `--force` : écraser si le dossier existe déjà.

Mise à jour :

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>` : mettre à jour vers une version spécifique (slug unique uniquement).
- `--force` : écraser lorsque les fichiers locaux ne correspondent à aucune version publiée.

Lister :

- `clawhub list` (lit `.clawhub/lock.json`)

Publier des Skills :

- `clawhub skill publish <path>`
- `--slug <slug>` : slug du Skills.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du changelog (peut être vide).
- `--tags <tags>` : tags séparés par des virgules (par défaut : `latest`).

Publier des plugins :

- `clawhub package publish <source>`
- `<source>` peut être un dossier local, `owner/repo`, `owner/repo@ref`, ou une URL GitHub.
- `--dry-run` : construire le plan exact de publication sans rien téléverser.
- `--json` : produire une sortie lisible par machine pour la CI.
- `--source-repo`, `--source-commit`, `--source-ref` : remplacements facultatifs lorsque l’auto-détection ne suffit pas.

Supprimer/restaurer (propriétaire/admin uniquement) :

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Synchroniser (analyser les Skills locaux + publier les nouveaux/mis à jour) :

- `clawhub sync`
- `--root <dir...>` : racines d’analyse supplémentaires.
- `--all` : tout téléverser sans invites.
- `--dry-run` : montrer ce qui serait téléversé.
- `--bump <type>` : `patch|minor|major` pour les mises à jour (par défaut : `patch`).
- `--changelog <text>` : changelog pour les mises à jour non interactives.
- `--tags <tags>` : tags séparés par des virgules (par défaut : `latest`).
- `--concurrency <n>` : vérifications du registre (par défaut : 4).

## Flux de travail courants pour les agents

### Rechercher des Skills

```bash
clawhub search "postgres backups"
```

### Télécharger de nouveaux Skills

```bash
clawhub install my-skill-pack
```

### Mettre à jour les Skills installés

```bash
clawhub update --all
```

### Sauvegarder vos Skills (publication ou synchronisation)

Pour un dossier Skills unique :

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Pour analyser et sauvegarder de nombreux Skills à la fois :

```bash
clawhub sync --all
```

### Publier un plugin depuis GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Les plugins de code doivent inclure les métadonnées OpenClaw requises dans `package.json` :

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Les packages publiés doivent livrer le JavaScript compilé et faire pointer `runtimeExtensions`
vers cette sortie. Les installations depuis un checkout git peuvent toujours revenir au source TypeScript
lorsqu’aucun fichier compilé n’existe, mais les points d’entrée d’exécution compilés évitent la compilation
TypeScript à l’exécution dans les chemins de démarrage, doctor et chargement de plugin.

## Détails avancés (techniques)

### Versionnement et tags

- Chaque publication crée une nouvelle `SkillVersion` **semver**.
- Les tags (comme `latest`) pointent vers une version ; déplacer les tags permet de revenir en arrière.
- Les changelogs sont attachés par version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

### Modifications locales vs versions du registre

Les mises à jour comparent le contenu local du Skills aux versions du registre en utilisant un hachage de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la CLI demande confirmation avant l’écrasement (ou exige `--force` dans les exécutions non interactives).

### Analyse de synchronisation et racines de repli

`clawhub sync` analyse d’abord votre répertoire de travail courant. Si aucun Skills n’est trouvé, il revient à des emplacements hérités connus (par exemple `~/openclaw/skills` et `~/.openclaw/skills`). Ceci est conçu pour retrouver d’anciennes installations de Skills sans drapeaux supplémentaires.

### Stockage et fichier de verrouillage

- Les Skills installés sont enregistrés dans `.clawhub/lock.json` sous votre répertoire de travail.
- Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (remplacement via `CLAWHUB_CONFIG_PATH`).

### Télémétrie (comptes d’installation)

Lorsque vous exécutez `clawhub sync` tout en étant connecté, la CLI envoie un instantané minimal pour calculer les comptes d’installation. Vous pouvez désactiver cela complètement :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variables d’environnement

- `CLAWHUB_SITE` : remplacer l’URL du site.
- `CLAWHUB_REGISTRY` : remplacer l’URL de l’API du registre.
- `CLAWHUB_CONFIG_PATH` : remplacer l’emplacement où la CLI stocke le jeton/la configuration.
- `CLAWHUB_WORKDIR` : remplacer le répertoire de travail par défaut.
- `CLAWHUB_DISABLE_TELEMETRY=1` : désactiver la télémétrie sur `sync`.
