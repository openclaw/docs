---
read_when:
    - Expliquer ce qu’est ClawHub
    - Recherche, installation ou mise à jour de Skills ou de Plugins
    - Publication de Skills ou de plugins dans le registre
    - Choisir entre les flux CLI openclaw et clawhub
sidebarTitle: ClawHub
summary: Vue d’ensemble publique de ClawHub pour la découverte, l’installation, la publication, la sécurité et la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T04:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub est le registre public pour les Skills et les plugins OpenClaw.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez la CLI `clawhub` distincte pour l’authentification au registre, la publication, la suppression/restauration et les flux de synchronisation.

Site : [clawhub.ai](https://clawhub.ai)

## Démarrage rapide

Rechercher et installer des Skills avec OpenClaw :

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Rechercher et installer des plugins avec OpenClaw :

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installez la CLI ClawHub lorsque vous voulez des flux authentifiés auprès du registre, comme
publier, synchroniser ou supprimer/restaurer :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Ce que ClawHub héberge

| Surface        | Ce qu’elle stocke                                           | Commande typique                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Ensembles de texte versionnés avec `SKILL.md` et des fichiers de support | `openclaw skills install <slug>`             |
| Plugins de code | Paquets de plugins OpenClaw avec métadonnées de compatibilité | `openclaw plugins install clawhub:<package>` |
| Plugins groupés | Ensembles de plugins empaquetés pour la distribution OpenClaw | `clawhub package publish <source>`           |
| Souls          | Ensembles `SOUL.md` affichés sur onlycrabs.ai                | Flux de publication Web et API               |

ClawHub suit les versions semver, les tags comme `latest`, les journaux des modifications, les fichiers,
les téléchargements, les étoiles et les résumés d’analyse de sécurité. Les pages publiques affichent l’état actuel du registre
afin que les utilisateurs puissent inspecter un Skill ou un plugin avant de l’installer.

## Flux OpenClaw natifs

Les commandes OpenClaw natives installent dans l’espace de travail OpenClaw actif et conservent
les métadonnées de source afin que les commandes de mise à jour ultérieures puissent rester sur ClawHub.

Utilisez `clawhub:<package>` lorsqu’une installation de plugin doit être résolue via ClawHub.
Les spécifications de plugin nues compatibles npm peuvent être résolues via npm pendant les bascules de lancement, et
`npm:<package>` reste limité à npm lorsqu’une source doit être explicite.

Les installations de plugins valident la compatibilité `pluginApi` et `minGatewayVersion`
annoncée avant l’installation de l’archive. Lorsqu’une version de paquet publie un artefact
ClawPack, OpenClaw préfère le `.tgz` npm-pack exact téléversé, vérifie
l’en-tête de condensat ClawHub et les octets téléchargés, puis enregistre les métadonnées de l’artefact pour
les mises à jour ultérieures.

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

La CLI dispose aussi de commandes d’installation/mise à jour de Skills pour les flux directs du registre :

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Ces commandes installent les Skills dans `./skills` sous le répertoire de travail courant
et enregistrent les versions installées dans `.clawhub/lock.json`.

## Publication

Publiez des Skills depuis un dossier local contenant `SKILL.md` :

```bash
clawhub skill publish <path>
```

Options de publication courantes :

- `--slug <slug>` : slug du Skill.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du journal des modifications.
- `--tags <tags>` : tags séparés par des virgules, `latest` par défaut.

Publiez des plugins depuis un dossier local, `owner/repo`, `owner/repo@ref` ou une URL GitHub :

```bash
clawhub package publish <source>
```

Utilisez `--dry-run` pour construire le plan de publication exact sans téléverser, et `--json`
pour une sortie adaptée à la CI.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw requises dans
`package.json`, notamment `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`. Voir [CLI](/fr/clawhub/cli) pour la référence complète des commandes
et [Format des Skills](/fr/clawhub/skill-format) pour les métadonnées des Skills.

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser, mais la publication nécessite un compte GitHub
assez ancien pour franchir la barrière de téléversement. Les pages de détail publiques résument
le dernier état d’analyse avant l’installation ou le téléchargement.

ClawHub exécute des vérifications automatisées sur les Skills et les versions de plugins publiés. Les versions retenues par l’analyse
ou bloquées peuvent disparaître du catalogue public et des surfaces d’installation tout en
restant visibles pour leur propriétaire dans `/dashboard`.

Les utilisateurs connectés peuvent signaler des Skills et des paquets. Les modérateurs peuvent examiner les signalements,
masquer ou restaurer du contenu, et bannir les comptes abusifs. Voir
[Utilisation acceptable](/fr/clawhub/acceptable-usage) et
[Sécurité + modération](/fr/clawhub/security) pour les détails de politique et d’application.

## Télémétrie et environnement

Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané minimal afin que
ClawHub puisse calculer les nombres d’installations. Désactivez cela avec :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Substitutions d’environnement utiles :

| Variable                      | Effet                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Remplacer l’URL du site utilisée pour la connexion dans le navigateur. |
| `CLAWHUB_REGISTRY`            | Remplacer l’URL de l’API du registre.             |
| `CLAWHUB_CONFIG_PATH`         | Remplacer l’emplacement où la CLI stocke l’état des jetons/configurations. |
| `CLAWHUB_WORKDIR`             | Remplacer le répertoire de travail par défaut.    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactiver la télémétrie sur `sync`.              |

Voir [Télémétrie](/fr/clawhub/telemetry), [API HTTP](/fr/clawhub/http-api) et
[Dépannage](/fr/clawhub/troubleshooting) pour une documentation de référence plus approfondie.
