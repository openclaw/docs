---
read_when:
    - Expliquer ce qu’est ClawHub
    - Recherche, installation ou mise à jour de Skills ou de plugins
    - Publication de Skills ou de Plugins dans le registre
    - Choisir entre les flux CLI openclaw et clawhub
sidebarTitle: ClawHub
summary: Présentation publique de ClawHub pour la découverte, l’installation, la publication, la sécurité et la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub est le registre public des Skills et plugins OpenClaw.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez la CLI `clawhub` distincte pour les workflows d’authentification au registre, de publication, de suppression/restauration et de synchronisation.

Site : [clawhub.ai](https://clawhub.ai)

## Démarrage rapide

Recherchez et installez des Skills avec OpenClaw :

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Recherchez et installez des plugins avec OpenClaw :

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installez la CLI ClawHub lorsque vous voulez des workflows authentifiés auprès du registre, comme la publication, la synchronisation ou la suppression/restauration :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Ce que ClawHub héberge

| Surface        | Ce qu’elle stocke                                           | Commande typique                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Lots de texte versionnés avec `SKILL.md` et fichiers de prise en charge | `openclaw skills install <slug>`             |
| Plugins de code | Packages de plugins OpenClaw avec métadonnées de compatibilité | `openclaw plugins install clawhub:<package>` |
| Plugins groupés | Lots de plugins empaquetés pour la distribution OpenClaw    | `clawhub package publish <source>`           |
| Souls          | Lots `SOUL.md` affichés sur onlycrabs.ai                     | Flux de publication Web et API               |

ClawHub suit les versions semver, les tags comme `latest`, les changelogs, les fichiers, les téléchargements, les étoiles et les résumés d’analyse de sécurité. Les pages publiques affichent l’état actuel du registre afin que les utilisateurs puissent inspecter une Skill ou un plugin avant de l’installer.

## Flux OpenClaw natifs

Les commandes OpenClaw natives installent dans l’espace de travail OpenClaw actif et conservent les métadonnées de source afin que les commandes de mise à jour ultérieures puissent rester sur ClawHub.

Utilisez `clawhub:<package>` lorsqu’une installation de plugin doit être résolue via ClawHub. Les spécifications de plugin nues compatibles npm peuvent être résolues via npm pendant les transitions de lancement, et `npm:<package>` reste limité à npm lorsqu’une source doit être explicite.

Les installations de plugins valident la compatibilité `pluginApi` et `minGatewayVersion` annoncée avant l’installation de l’archive. Lorsqu’une version de package publie un artefact ClawPack, OpenClaw privilégie le `.tgz` npm-pack exact téléversé, vérifie l’en-tête de digest ClawHub et les octets téléchargés, puis enregistre les métadonnées d’artefact pour les mises à jour ultérieures.

## CLI ClawHub

La CLI ClawHub sert au travail authentifié auprès du registre :

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

La CLI propose aussi des commandes d’installation et de mise à jour de Skills pour les workflows directs avec le registre :

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Ces commandes installent les Skills dans `./skills` sous le répertoire de travail actuel et enregistrent les versions installées dans `.clawhub/lock.json`.

## Publication

Publiez des Skills depuis un dossier local contenant `SKILL.md` :

```bash
clawhub skill publish <path>
```

Options de publication courantes :

- `--slug <slug>` : slug de la Skill.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du changelog.
- `--tags <tags>` : tags séparés par des virgules, avec `latest` par défaut.

Publiez des plugins depuis un dossier local, `owner/repo`, `owner/repo@ref` ou une URL GitHub :

```bash
clawhub package publish <source>
```

Utilisez `--dry-run` pour générer le plan de publication exact sans téléversement, et `--json` pour une sortie adaptée à la CI.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw requises dans `package.json`, notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`. Consultez [CLI](/fr/clawhub/cli) pour la référence complète des commandes et [Format de Skill](/fr/clawhub/skill-format) pour les métadonnées de Skill.

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser, mais la publication requiert un compte GitHub assez ancien pour franchir la barrière de téléversement. Les pages de détail publiques résument le dernier état d’analyse avant installation ou téléchargement.

ClawHub exécute des vérifications automatisées sur les Skills et les versions de plugins publiées. Les versions retenues par l’analyse ou bloquées peuvent disparaître du catalogue public et des surfaces d’installation tout en restant visibles par leur propriétaire dans `/dashboard`.

Les utilisateurs connectés peuvent signaler des Skills et des packages. Les modérateurs peuvent examiner les signalements, masquer ou restaurer du contenu, et bannir les comptes abusifs. Consultez [Utilisation acceptable](/fr/clawhub/acceptable-usage) et [Sécurité + modération](/fr/clawhub/security) pour les détails de politique et d’application.

## Télémétrie et environnement

Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané minimal afin que ClawHub puisse calculer les nombres d’installations. Désactivez cela avec :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Surcharges d’environnement utiles :

| Variable                      | Effet                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Remplace l’URL du site utilisée pour la connexion par navigateur. |
| `CLAWHUB_REGISTRY`            | Remplace l’URL de l’API du registre.              |
| `CLAWHUB_CONFIG_PATH`         | Remplace l’emplacement où la CLI stocke l’état des tokens/config. |
| `CLAWHUB_WORKDIR`             | Remplace le répertoire de travail par défaut.     |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie lors de `sync`.           |

Consultez [Télémétrie](/fr/clawhub/telemetry), [API HTTP](/fr/clawhub/http-api) et [Dépannage](/fr/clawhub/troubleshooting) pour des références plus détaillées.
