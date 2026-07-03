---
read_when:
    - Expliquer ce qu’est ClawHub
    - Recherche, installation ou mise à jour de Skills ou de plugins
    - Publication de Skills ou de plugins dans le registre
    - Choisir entre les flux CLI openclaw et ClawHub
sidebarTitle: ClawHub
summary: Vue d’ensemble publique de ClawHub pour la découverte, l’installation, la publication, la sécurité et la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T13:27:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub est le registre public des Skills et plugins OpenClaw.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez la CLI `clawhub` distincte pour l’authentification au registre, la publication et les flux de suppression/restauration.

Site : [clawhub.ai](https://clawhub.ai)

## Démarrage rapide

Rechercher et installer des Skills avec OpenClaw :

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Rechercher et installer des plugins avec OpenClaw :

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installez la CLI ClawHub lorsque vous avez besoin de flux authentifiés auprès du registre, comme
la publication ou la suppression/restauration :

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Ce que ClawHub héberge

| Surface        | Ce qu’elle stocke                                           | Commande typique                            |
| -------------- | ------------------------------------------------------------ | ------------------------------------------ |
| Skills         | Paquets de texte versionnés avec `SKILL.md` et fichiers de support | `openclaw skills install @openclaw/demo`     |
| Plugins de code | Packages de plugins OpenClaw avec métadonnées de compatibilité | `openclaw plugins install clawhub:<package>` |
| Plugins groupés | Lots de plugins empaquetés pour la distribution OpenClaw    | `clawhub package publish <source>`           |

ClawHub suit les versions semver, les balises comme `latest`, les journaux des modifications, les fichiers,
les téléchargements, les étoiles et les résumés d’analyses de sécurité. Les pages publiques affichent l’état actuel du registre
afin que les utilisateurs puissent inspecter une Skill ou un plugin avant de l’installer.

## Flux OpenClaw natifs

Les commandes OpenClaw natives installent dans l’espace de travail OpenClaw actif et conservent les métadonnées
de source afin que les commandes de mise à jour ultérieures puissent rester sur ClawHub.

Utilisez `clawhub:<package>` lorsqu’une installation de plugin doit être résolue via ClawHub.
Les spécifications de plugins compatibles avec npm sans préfixe peuvent être résolues via npm pendant les bascules de lancement, et
`npm:<package>` reste limité à npm lorsqu’une source doit être explicite.

Les installations de plugins valident la compatibilité `pluginApi` et `minGatewayVersion`
annoncée avant l’installation de l’archive. Lorsqu’une version de package publie un
artefact ClawPack, OpenClaw préfère le `.tgz` npm-pack exact téléversé, vérifie
l’en-tête de résumé ClawHub et les octets téléchargés, puis enregistre les métadonnées de l’artefact pour
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
```

La CLI dispose aussi de commandes d’installation/mise à jour de Skills pour les flux directs avec le registre :

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>` : nom d’URL de la Skill publiée.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du journal des modifications.
- `--tags <tags>` : balises séparées par des virgules, avec `latest` par défaut.

Publiez des plugins depuis un dossier local, `owner/repo`, `owner/repo@ref` ou une URL GitHub :

```bash
clawhub package publish <source>
```

Utilisez `--dry-run` pour générer le plan de publication exact sans téléversement, et `--json`
pour une sortie adaptée à la CI.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw requises dans
`package.json`, notamment `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`. Consultez [CLI](/fr/clawhub/cli) pour la référence complète des commandes
et [Format des Skills](/clawhub/skill-format) pour les métadonnées des Skills.

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser, mais la publication nécessite un compte GitHub
assez ancien pour passer la barrière de téléversement. Les pages de détail publiques résument
le dernier état d’analyse avant l’installation ou le téléchargement.

ClawHub exécute des vérifications automatisées sur les Skills publiées et les versions de plugins. Les versions retenues par analyse
ou bloquées peuvent disparaître du catalogue public et des surfaces d’installation tout en
restant visibles pour leur propriétaire dans `/dashboard`.

Les utilisateurs connectés peuvent signaler des Skills et des packages. Les modérateurs peuvent examiner les signalements,
masquer ou restaurer du contenu, et bannir les comptes abusifs. Consultez
[Sécurité](/fr/clawhub/security),
[Audits de sécurité](/clawhub/security-audits),
[Modération et sécurité des comptes](/clawhub/moderation) et
[Utilisation acceptable](/clawhub/acceptable-usage) pour les détails de politique et d’application.

## Télémétrie et environnement

Lorsque vous exécutez `clawhub install` en étant connecté, la CLI peut envoyer un événement
d’installation au mieux afin que ClawHub puisse calculer des nombres d’installations agrégés. Désactivez cela avec :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Substitutions d’environnement utiles :

| Variable                      | Effet                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Remplace l’URL du site utilisée pour la connexion par navigateur. |
| `CLAWHUB_REGISTRY`            | Remplace l’URL de l’API du registre.             |
| `CLAWHUB_CONFIG_PATH`         | Remplace l’emplacement où la CLI stocke l’état des jetons/de la configuration. |
| `CLAWHUB_WORKDIR`             | Remplace le répertoire de travail par défaut.    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie d’installation.          |

Consultez [Télémétrie](/clawhub/telemetry), [API HTTP](/clawhub/http-api) et
[Dépannage](/fr/clawhub/troubleshooting) pour des documents de référence plus approfondis.
