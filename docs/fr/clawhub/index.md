---
read_when:
    - Expliquer ce qu’est ClawHub
    - Recherche, installation ou mise à jour de Skills ou de plugins
    - Publication de Skills ou de plugins dans le registre
    - Choisir entre les flux CLI d’OpenClaw et de ClawHub
sidebarTitle: ClawHub
summary: Présentation publique de ClawHub pour la découverte, l’installation, la publication, la sécurité et la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T13:02:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub est le registre public des Skills et plugins OpenClaw.

- Utilisez les commandes `openclaw` natives pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez la CLI `clawhub` distincte pour l’authentification auprès du registre, la publication et les processus de suppression/restauration.

Site : [clawhub.ai](https://clawhub.ai)

## Démarrage rapide

Recherchez et installez des Skills avec OpenClaw :

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Recherchez et installez des plugins avec OpenClaw :

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installez la CLI ClawHub lorsque vous souhaitez utiliser des processus authentifiés auprès du registre, tels que
la publication ou la suppression/restauration :

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

## Contenu hébergé par ClawHub

| Surface        | Contenu stocké                                               | Commande type                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Paquets de texte versionnés avec `SKILL.md` et fichiers complémentaires | `openclaw skills install @openclaw/demo`     |
| Plugins de code   | Paquets de plugins OpenClaw avec métadonnées de compatibilité         | `openclaw plugins install clawhub:<package>` |
| Plugins groupés | Paquets de plugins regroupés pour la distribution d’OpenClaw            | `clawhub package publish <source>`           |

ClawHub suit les versions semver, les étiquettes telles que `latest`, les journaux des modifications, les fichiers,
les téléchargements, les favoris et les résumés des analyses de sécurité. Les pages publiques affichent l’état actuel du registre
afin que les utilisateurs puissent examiner un Skill ou un plugin avant de l’installer.

## Processus OpenClaw natifs

Les commandes OpenClaw natives effectuent l’installation dans l’espace de travail OpenClaw actif et conservent
les métadonnées de la source afin que les commandes de mise à jour ultérieures puissent continuer à utiliser ClawHub.

Utilisez `clawhub:<package>` lorsqu’une installation de plugin doit être résolue par l’intermédiaire de ClawHub.
Les spécifications de plugins sans préfixe compatibles avec npm peuvent être résolues par npm pendant les transitions de lancement, tandis que
`npm:<package>` reste réservé à npm lorsqu’une source doit être explicite.

Les installations de plugins valident la compatibilité `pluginApi` et `minGatewayVersion`
annoncée avant l’installation de l’archive. Lorsqu’une version de paquet publie un artefact
ClawPack, OpenClaw privilégie le fichier npm-pack `.tgz` exact téléversé, vérifie
l’en-tête de condensat ClawHub et les octets téléchargés, puis enregistre les métadonnées de l’artefact pour
les mises à jour ultérieures.

## CLI ClawHub

La CLI ClawHub est destinée aux opérations authentifiées auprès du registre :

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

La CLI fournit également des commandes d’installation et de mise à jour des Skills pour les processus directs avec le registre :

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ces commandes installent les Skills dans `./skills` sous le répertoire de travail actuel
et consignent les versions installées dans `.clawhub/lock.json`.

## Publication

Publiez des Skills depuis un dossier local contenant `SKILL.md` :

```bash
clawhub skill publish <path>
```

Options de publication courantes :

- `--slug <slug>` : nom utilisé dans l’URL du Skill publié.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du journal des modifications.
- `--tags <tags>` : étiquettes séparées par des virgules, avec `latest` comme valeur par défaut.

Publiez des plugins depuis un dossier local, `owner/repo`, `owner/repo@ref` ou une URL
GitHub :

```bash
clawhub package publish <source>
```

Utilisez `--dry-run` pour créer le plan de publication exact sans téléversement, et `--json`
pour obtenir une sortie adaptée à la CI.

Les plugins de code doivent inclure les métadonnées de compatibilité OpenClaw requises dans
`package.json`, notamment `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`. Consultez la [CLI](/fr/clawhub/cli) pour obtenir la référence complète des commandes
et le [format des Skills](/clawhub/skill-format) pour les métadonnées des Skills.

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser du contenu, mais la publication nécessite un compte
GitHub suffisamment ancien pour satisfaire aux conditions de téléversement. Les pages publiques détaillées résument
l’état de la dernière analyse avant l’installation ou le téléchargement.

ClawHub exécute des vérifications automatisées sur les Skills publiés et les versions de plugins. Les versions retenues
par une analyse ou bloquées peuvent disparaître du catalogue public et des surfaces d’installation tout en
restant visibles par leur propriétaire dans `/dashboard`.

Les utilisateurs connectés peuvent signaler des Skills et des paquets. Les modérateurs peuvent examiner les signalements,
masquer ou restaurer du contenu et bannir les comptes abusifs. Consultez
[Sécurité](/fr/clawhub/security),
[Audits de sécurité](/clawhub/security-audits),
[Modération et sécurité des comptes](/clawhub/moderation) et
[Utilisation acceptable](/clawhub/acceptable-usage) pour en savoir plus sur les politiques et leur application.

## Télémétrie et environnement

Lorsque vous exécutez `clawhub install` en étant connecté, la CLI peut envoyer, dans la mesure du possible,
un événement d’installation afin que ClawHub puisse calculer le nombre total d’installations. Désactivez cette fonctionnalité avec :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Variables d’environnement utiles pour remplacer les valeurs par défaut :

| Variable                      | Effet                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Remplace l’URL du site utilisée pour la connexion dans le navigateur.     |
| `CLAWHUB_REGISTRY`            | Remplace l’URL de l’API du registre.                    |
| `CLAWHUB_CONFIG_PATH`         | Remplace l’emplacement où la CLI stocke l’état des jetons et de la configuration. |
| `CLAWHUB_WORKDIR`             | Remplace le répertoire de travail par défaut.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie des installations.                        |

Consultez [Télémétrie](/clawhub/telemetry), [API HTTP](/clawhub/http-api) et
[Dépannage](/fr/clawhub/troubleshooting) pour obtenir des informations de référence plus détaillées.
