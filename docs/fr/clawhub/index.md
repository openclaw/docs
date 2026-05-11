---
read_when:
    - Expliquer ce qu’est ClawHub
    - Rechercher, installer ou mettre à jour des Skills ou des plugins
    - Publication de Skills ou de Plugins dans le registre
    - Choisir entre les flux CLI openclaw et clawhub
sidebarTitle: ClawHub
summary: Aperçu public de ClawHub pour la découverte, l’installation, la publication, la sécurité et la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub est le registre public des Skills et plugins OpenClaw.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez le CLI séparé `clawhub` pour l’authentification au registre, la publication, la suppression/restauration, les réanalyses et les workflows de synchronisation.

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

Installez le CLI ClawHub lorsque vous voulez des workflows authentifiés auprès du registre, tels que la publication, la synchronisation, la suppression/restauration ou des réanalyses demandées par le propriétaire :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Ce que ClawHub héberge

| Surface        | Ce qu’il stocke                                             | Commande typique                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Ensembles de textes versionnés avec `SKILL.md` et fichiers de prise en charge | `openclaw skills install <slug>`             |
| Plugins de code | Packages de plugins OpenClaw avec métadonnées de compatibilité | `openclaw plugins install clawhub:<package>` |
| Plugins groupés | Ensembles de plugins empaquetés pour la distribution OpenClaw | `clawhub package publish <source>`           |
| Souls          | Ensembles `SOUL.md` affichés sur onlycrabs.ai                | Flux de publication Web et API               |

ClawHub suit les versions semver, les balises comme `latest`, les journaux de modifications, les fichiers, les téléchargements, les étoiles et les résumés d’analyse de sécurité. Les pages publiques affichent l’état actuel du registre afin que les utilisateurs puissent inspecter une Skill ou un plugin avant de l’installer.

## Flux OpenClaw natifs

Les commandes OpenClaw natives installent dans l’espace de travail OpenClaw actif et conservent les métadonnées de source afin que les commandes de mise à jour ultérieures puissent rester sur ClawHub.

Utilisez `clawhub:<package>` lorsqu’une installation de plugin doit être résolue via ClawHub. Les spécifications de plugins compatibles npm sans préfixe peuvent être résolues via npm pendant les transitions de lancement, et `npm:<package>` reste limité à npm lorsqu’une source doit être explicite.

Les installations de plugins valident la compatibilité annoncée de `pluginApi` et `minGatewayVersion` avant l’installation de l’archive. Lorsqu’une version de package publie un artefact ClawPack, OpenClaw préfère le `.tgz` npm-pack exact téléversé, vérifie l’en-tête de condensat ClawHub et les octets téléchargés, puis enregistre les métadonnées de l’artefact pour les mises à jour ultérieures.

## CLI ClawHub

Le CLI ClawHub sert au travail authentifié auprès du registre :

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

Le CLI possède aussi des commandes d’installation/mise à jour de Skills pour les workflows directs avec le registre :

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Ces commandes installent les Skills dans `./skills` sous le répertoire de travail courant et enregistrent les versions installées dans `.clawhub/lock.json`.

## Publication

Publiez des Skills depuis un dossier local contenant `SKILL.md` :

```bash
clawhub skill publish <path>
```

Options de publication courantes :

- `--slug <slug>` : slug de la Skill.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du journal de modifications.
- `--tags <tags>` : balises séparées par des virgules, avec `latest` par défaut.

Publiez des plugins depuis un dossier local, `owner/repo`, `owner/repo@ref` ou une URL GitHub :

```bash
clawhub package publish <source>
```

Utilisez `--dry-run` pour construire le plan de publication exact sans téléversement, et `--json` pour une sortie adaptée à la CI.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw requises dans `package.json`, notamment `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`. Consultez [CLI](/fr/clawhub/cli) pour la référence complète des commandes et [Format de Skill](/fr/clawhub/skill-format) pour les métadonnées des Skills.

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser du contenu, mais la publication nécessite un compte GitHub suffisamment ancien pour passer la barrière de téléversement. Les pages de détail publiques résument le dernier état d’analyse avant installation ou téléchargement.

ClawHub exécute des vérifications automatisées sur les Skills publiées et les versions de plugins. Les versions retenues par l’analyse ou bloquées peuvent disparaître du catalogue public et des surfaces d’installation tout en restant visibles par leur propriétaire dans `/dashboard`.

Les propriétaires peuvent demander des réanalyses limitées pour corriger des faux positifs. Les modérateurs et administrateurs de la plateforme peuvent demander des réanalyses pour n’importe quelle Skill ou package lorsqu’ils traitent des rapports d’assistance :

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Les utilisateurs connectés peuvent signaler des Skills et des packages. Les modérateurs peuvent examiner les signalements, masquer ou restaurer du contenu, résoudre les appels et bannir les comptes abusifs. Consultez [Utilisation acceptable](/fr/clawhub/acceptable-usage) et [Sécurité + modération](/fr/clawhub/security) pour les détails sur les règles et leur application.

## Télémétrie et environnement

Lorsque vous exécutez `clawhub sync` en étant connecté, le CLI envoie un instantané minimal afin que ClawHub puisse calculer le nombre d’installations. Désactivez cela avec :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Variables d’environnement utiles :

| Variable                      | Effet                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Remplace l’URL du site utilisée pour la connexion dans le navigateur. |
| `CLAWHUB_REGISTRY`            | Remplace l’URL de l’API du registre.             |
| `CLAWHUB_CONFIG_PATH`         | Remplace l’emplacement où le CLI stocke l’état du jeton/de la configuration. |
| `CLAWHUB_WORKDIR`             | Remplace le répertoire de travail par défaut.    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie sur `sync`.              |

Consultez [Télémétrie](/fr/clawhub/telemetry), [API HTTP](/fr/clawhub/http-api) et [Dépannage](/fr/clawhub/troubleshooting) pour une documentation de référence plus approfondie.
