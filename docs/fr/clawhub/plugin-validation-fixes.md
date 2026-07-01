---
read_when:
    - Vous avez exécuté clawhub package validate et devez corriger les constats du Plugin
    - ClawHub a rejeté ou émis un avertissement lors de la publication d’un package Plugin
    - Vous mettez à jour les métadonnées du package Plugin avant la publication
summary: Corriger les constats de validation du package de Plugin ClawHub avant publication
title: Correctifs de validation des Plugins
x-i18n:
    generated_at: "2026-07-01T15:23:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correctifs de validation des Plugins

ClawHub valide les packages de Plugins avant publication et peut aussi afficher les constats issus
d’analyses automatisées de packages. Cette page couvre les constats destinés aux auteurs, c’est-à-dire
les constats que l’auteur du Plugin peut corriger dans les métadonnées de son package, son manifeste, ses
imports SDK ou son artefact publié.

Elle ne couvre pas les constats de couverture internes de Plugin Inspector. Si un rapport complet
contient des codes de maintenance de scanner sans consignes de remédiation pour l’auteur, ceux-ci
s’adressent aux mainteneurs d’OpenClaw plutôt qu’aux auteurs de Plugins.

Après avoir appliqué un correctif, relancez :

```bash
clawhub package validate <path-to-plugin>
```

## Constats destinés aux auteurs

| Code                                    | Commencez ici                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Ajouter les métadonnées du package](/fr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Ajouter le bloc openclaw du package](/fr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Déclarer les points d’entrée du package OpenClaw](/fr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publier le point d’entrée déclaré](/fr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Compléter les métadonnées d’installation](/fr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Déclarer la compatibilité de l’API de Plugin](/fr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Aligner la version minimale de l’hôte](/fr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Aligner les versions du package et du manifeste](/fr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Supprimer les métadonnées de package OpenClaw non prises en charge](/fr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendre l’artefact npm empaquetable](/fr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Inclure les points d’entrée dans la sortie npm pack](/fr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Inclure les métadonnées dans la sortie npm pack](/fr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Ajouter un nom d’affichage au manifeste](/fr/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Supprimer les champs de manifeste non pris en charge](/fr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Supprimer les clés de contrat non prises en charge](/fr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Remplacer les imports SDK racine](/fr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Supprimer les imports SDK réservés](/fr/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Remplacer l’accès au store de session complet](/fr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Remplacer les écritures dans le store de session complet](/fr/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Remplacer les helpers de chemins de fichiers de session](/fr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Remplacer les anciennes cibles de fichiers de transcription](/fr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Remplacer les helpers de transcription de bas niveau](/fr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Remplacer before_agent_start](/fr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Déplacer les variables d’environnement du fournisseur vers les métadonnées de configuration](/fr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Reproduire les variables d’environnement du canal dans les métadonnées actuelles](/fr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Supprimer les références indisponibles au schéma de manifeste de sécurité](/fr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Supprimer les fichiers de manifeste de sécurité non pris en charge](/fr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Métadonnées du package

### package-json-missing

La racine du package n’inclut pas `package.json`, donc ClawHub ne peut pas identifier le
package npm, sa version, ses points d’entrée ni ses métadonnées OpenClaw.

- Ajoutez `package.json` avec `name`, `version` et `type`.
- Ajoutez un bloc `openclaw` lorsque le package fournit un Plugin OpenClaw.
- Utilisez [Créer des Plugins](/fr/plugins/building-plugins) pour un exemple minimal de package
  et [Manifeste de Plugin](/fr/plugins/manifest#manifest-versus-packagejson)
  pour la séparation entre package et manifeste.
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Le package contient `package.json`, mais il ne déclare pas de métadonnées de package
OpenClaw.

- Ajoutez `package.json#openclaw`.
- Incluez des métadonnées de point d’entrée comme `openclaw.extensions` ou
  `openclaw.runtimeExtensions`.
- Ajoutez les métadonnées de compatibilité et d’installation lorsque le package sera publié ou
  installé via ClawHub.
- Consultez [Champs package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Les métadonnées du package existent, mais elles ne déclarent pas de point d’entrée d’exécution
OpenClaw.

- Ajoutez `openclaw.extensions` pour les points d’entrée de Plugins natifs.
- Ajoutez `openclaw.runtimeExtensions` lorsque le package publié doit charger du JavaScript
  compilé.
- Conservez tous les chemins de points d’entrée dans le répertoire du package.
- Consultez [Points d’entrée des Plugins](/fr/plugins/sdk-entrypoints) et
  [Champs package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Le package déclare un point d’entrée OpenClaw, mais le fichier référencé est absent
du package en cours de validation.

- Vérifiez chaque chemin dans `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` et `openclaw.runtimeSetupEntry`.
- Compilez le package si le point d’entrée est généré dans `dist`.
- Mettez à jour les métadonnées si le point d’entrée a été déplacé.
- Consultez [Points d’entrée des Plugins](/fr/plugins/sdk-entrypoints).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub ne peut pas déterminer comment le package doit être installé ou mis à jour.

- Renseignez `openclaw.install` avec la source d’installation prise en charge, comme
  `clawhubSpec`, `npmSpec` ou `localPath`.
- Définissez `openclaw.install.defaultChoice` lorsque plusieurs sources d’installation sont
  disponibles.
- Utilisez `openclaw.install.minHostVersion` pour la version minimale de l’hôte OpenClaw.
- Consultez [Champs package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Le package ne déclare pas la plage d’API de Plugin OpenClaw qu’il prend en charge.

- Ajoutez `openclaw.compat.pluginApi` à `package.json`.
- Utilisez la version de l’API de Plugin OpenClaw ou la version minimale semver avec laquelle vous avez compilé et testé
  le package.
- Gardez cela séparé de la version du package. La version du package décrit la
  version publiée du Plugin ; `openclaw.compat.pluginApi` décrit le contrat d’API de l’hôte.
- Consultez [Champs package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La version minimale de l’hôte indiquée par le package ne correspond pas aux métadonnées de version OpenClaw
avec lesquelles le package a été compilé.

- Vérifiez `openclaw.install.minHostVersion`.
- Vérifiez toutes les métadonnées de build OpenClaw dans le package, comme la version OpenClaw
  utilisée lors de la publication.
- Alignez la version minimale de l’hôte avec la plage de versions de l’hôte que le package
  prend réellement en charge.
- Consultez [Champs package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La version du package et celle du manifeste du Plugin ne correspondent pas.

- Préférez `package.json#version` comme version de publication du package.
- Si `openclaw.plugin.json` contient aussi `version`, mettez-la à jour pour qu’elle corresponde, ou supprimez
  les métadonnées de version de manifeste obsolètes lorsque les métadonnées du package font autorité.
- Publiez une nouvelle version du package après avoir modifié des métadonnées publiées.
- Consultez [Manifeste de Plugin](/fr/plugins/manifest).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Le bloc `package.json#openclaw` contient des champs qui ne sont pas des métadonnées de package
OpenClaw prises en charge.

- Supprimez les champs non pris en charge comme `openclaw.bundle`.
- Conservez les métadonnées de Plugin natif dans `openclaw.plugin.json`.
- Conservez les points d’entrée, la compatibilité, l’installation, la configuration et les métadonnées de catalogue du package
  dans les champs `package.json#openclaw` pris en charge.
- Consultez [Champs package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

## Artefact publié

### package-npm-pack-unavailable

Le package ne peut pas être empaqueté dans l’artefact que ClawHub inspecterait ou
publierait.

- Exécutez `npm pack --dry-run` depuis la racine du package.
- Corrigez les métadonnées de package invalides, les scripts de cycle de vie cassés ou les entrées de fichiers qui
  font échouer l’empaquetage.
- Supprimez `private: true` si ce package est destiné à une publication publique.
- Relancez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Le package peut être empaqueté, mais l’artefact empaqueté n’inclut pas les
fichiers de point d’entrée déclarés dans `package.json#openclaw`.

- Exécutez `npm pack --dry-run` et inspectez les fichiers qui seraient inclus.
- Compilez les points d’entrée générés avant l’empaquetage.
- Mettez à jour `files`, `.npmignore` ou la sortie de build afin que les points d’entrée déclarés soient
  inclus.
- Consultez [Points d’entrée des Plugins](/fr/plugins/sdk-entrypoints).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Il manque à l’artefact empaqueté des métadonnées OpenClaw qui existent dans votre package
source.

- Exécutez `npm pack --dry-run` et inspectez les fichiers de métadonnées inclus.
- Assurez-vous que `package.json` inclut le bloc `openclaw` dans l’artefact empaqueté.
- Assurez-vous que `openclaw.plugin.json` est inclus lorsque le package est un Plugin OpenClaw
  natif.
- Mettez à jour `files` ou `.npmignore` afin que les métadonnées du package ne soient pas exclues.
- Consultez [Créer des Plugins](/fr/plugins/building-plugins).
- Relancez `clawhub package validate <path-to-plugin>`.

## Métadonnées du manifeste

### manifest-name-missing

Le manifeste du Plugin natif n’inclut pas de nom d’affichage.

- Ajoutez un champ `name` non vide à `openclaw.plugin.json`.
- Gardez `name` lisible par un humain et conservez `id` comme identifiant machine stable.
- Consultez [Manifeste du Plugin](/fr/plugins/manifest).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Le manifeste du Plugin contient des champs de premier niveau qu’OpenClaw ne prend pas en charge.

- Comparez chaque champ de premier niveau avec la
  [référence des champs du manifeste](/fr/plugins/manifest#top-level-field-reference).
- Supprimez les champs personnalisés de `openclaw.plugin.json`.
- Déplacez plutôt les métadonnées de paquet ou d’installation dans les champs `package.json#openclaw`
  pris en charge, au lieu du manifeste.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Le manifeste déclare des clés non prises en charge dans `contracts`.

- Comparez chaque clé sous `contracts` avec la
  [référence des contrats](/fr/plugins/manifest#contracts-reference).
- Supprimez les clés de contrat non prises en charge.
- Déplacez le comportement d’exécution dans le code d’enregistrement du Plugin, et limitez `contracts`
  aux métadonnées statiques de propriété des capacités.
- Réexécutez `clawhub package validate <path-to-plugin>`.

## SDK et migration de compatibilité

### legacy-root-sdk-import

Le Plugin importe depuis le barrel racine obsolète du SDK :
`openclaw/plugin-sdk`.

- Remplacez les imports du barrel racine par des imports de sous-chemins publics ciblés.
- Utilisez `openclaw/plugin-sdk/plugin-entry` pour `definePluginEntry`.
- Utilisez `openclaw/plugin-sdk/channel-core` pour les helpers de point d’entrée de canal.
- Utilisez les [conventions d’import](/fr/plugins/building-plugins#import-conventions) et les
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths) pour trouver l’import le plus étroit.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Le Plugin importe un chemin SDK réservé aux Plugins groupés ou à la compatibilité
interne.

- Remplacez les imports SDK internes réservés d’OpenClaw par des sous-chemins publics documentés
  `openclaw/plugin-sdk/*`.
- Si le comportement n’a pas de SDK public, conservez le helper dans votre paquet ou
  demandez une API publique OpenClaw.
- Utilisez les [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths) et la
  [migration du SDK](/fr/plugins/sdk-migration) pour choisir un import pris en charge.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Le Plugin utilise encore le helper obsolète de magasin de session complet
`loadSessionStore`.

- Utilisez `getSessionEntry(...)` ou `listSessionEntries(...)` lors de la lecture de l’état
  de session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` lors de l’écriture de l’état
  de session.
- Évitez de charger, modifier et enregistrer l’objet complet du magasin de session.
- Conservez `loadSessionStore(...)` uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge d’anciennes versions d’OpenClaw qui l’exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Le Plugin utilise encore un helper obsolète d’écriture du magasin de session complet, comme
`saveSessionStore` ou `updateSessionStore`.

- Utilisez `patchSessionEntry(...)` pour mettre à jour des champs sur une entrée de session
  existante.
- Utilisez `upsertSessionEntry(...)` pour remplacer ou créer une entrée de session.
- Évitez de charger, modifier et enregistrer l’objet complet du magasin de session.
- Conservez les helpers d’écriture du magasin complet uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge d’anciennes versions d’OpenClaw qui les exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Le Plugin utilise encore des helpers obsolètes de chemins de fichiers de session, comme
`resolveSessionFilePath` ou `resolveAndPersistSessionFile`.

- Utilisez `getSessionEntry(...)` pour lire les métadonnées de session par identité d’agent et de session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` pour persister les métadonnées de session.
- Utilisez l’identité de transcript ou les helpers de cible lorsque le code prépare une
  opération de transcript.
- Ne persistez pas et ne dépendez pas des anciens chemins de fichiers de transcript.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Le Plugin utilise encore le helper obsolète de cible de fichier de transcript
`resolveSessionTranscriptLegacyFileTarget`.

- Utilisez `resolveSessionTranscriptIdentity(...)` lorsque le code n’a besoin que de l’identité publique
  de session.
- Utilisez `resolveSessionTranscriptTarget(...)` lorsque le code a besoin d’une cible structurée
  d’opération de transcript.
- Évitez de lire ou de construire directement d’anciennes cibles de fichier de transcript.
- Conservez le helper obsolète uniquement tant que votre plage de compatibilité déclarée prend encore
  en charge d’anciennes versions d’OpenClaw qui l’exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Le Plugin utilise encore des helpers de bas niveau obsolètes pour les transcripts, comme
`appendSessionTranscriptMessage` ou `emitSessionTranscriptUpdate`.

- Utilisez `appendSessionTranscriptMessageByIdentity(...)` pour les ajouts au transcript.
- Utilisez `publishSessionTranscriptUpdateByIdentity(...)` pour les notifications de mise à jour
  du transcript.
- Préférez la surface d’exécution structurée des transcripts afin qu’OpenClaw puisse appliquer les
  bonnes limites transactionnelles et la bonne gestion de l’identité.
- Conservez les helpers de transcript de bas niveau uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge d’anciennes versions d’OpenClaw qui les exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Le Plugin utilise encore le hook hérité `before_agent_start`.

- Déplacez le travail de remplacement de modèle ou de fournisseur vers `before_model_resolve`.
- Déplacez le travail de mutation de prompt ou de contexte vers `before_prompt_build`.
- Conservez `before_agent_start` uniquement tant que votre plage de compatibilité déclarée prend encore
  en charge d’anciennes versions d’OpenClaw qui l’exigent.
- Consultez les [hooks](/fr/plugins/hooks) et la
  [compatibilité des Plugins](/fr/plugins/compatibility).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Le manifeste utilise encore les anciennes métadonnées d’authentification fournisseur `providerAuthEnvVars`.

- Répliquez les métadonnées de variables d’environnement du fournisseur dans `setup.providers[].envVars`.
- Conservez `providerAuthEnvVars` uniquement comme métadonnées de compatibilité tant que votre plage
  OpenClaw prise en charge en a encore besoin.
- Consultez la [référence de configuration](/fr/plugins/manifest#setup-reference) et la
  [migration du SDK](/fr/plugins/sdk-migration).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Le manifeste utilise des métadonnées anciennes ou héritées de variables d’environnement de canal sans les métadonnées actuelles
de configuration ou de setup attendues par ClawHub.

- Gardez les métadonnées de variables d’environnement de canal déclaratives afin qu’OpenClaw puisse inspecter l’état du setup
  sans charger l’exécution du canal.
- Répliquez la configuration de canal pilotée par l’environnement dans la configuration de setup actuelle, la configuration de canal ou les
  métadonnées de canal de paquet utilisées par la forme de votre Plugin.
- Conservez `channelEnvVars` uniquement comme métadonnées de compatibilité tant que les anciennes versions
  d’OpenClaw prises en charge l’exigent encore.
- Consultez le [manifeste du Plugin](/fr/plugins/manifest) et les
  [Plugins de canal](/fr/plugins/sdk-channel-plugins).
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Manifeste de sécurité

### security-manifest-schema-unavailable

Le paquet livre `openclaw.security.json` avec une référence de schéma que ClawHub
ne reconnaît pas comme disponible.

- Supprimez l’URL du schéma si elle est uniquement informative.
- Utilisez un schéma versionné documenté uniquement après qu’OpenClaw en a publié un.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Le paquet livre un fichier de manifeste de sécurité non pris en charge.

- Supprimez `openclaw.security.json` jusqu’à ce qu’OpenClaw documente un schéma de manifeste de sécurité
  versionné et le comportement de ClawHub.
- Gardez le comportement sensible à la sécurité documenté dans la documentation publique de votre paquet ou
  dans le README jusqu’à ce que le contrat de manifeste existe.
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Connexe

- [CLI ClawHub](/fr/clawhub/cli)
- [Publication ClawHub](/fr/clawhub/publishing)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Manifeste du Plugin](/fr/plugins/manifest)
- [Points d’entrée des Plugins](/fr/plugins/sdk-entrypoints)
- [Compatibilité des Plugins](/fr/plugins/compatibility)
