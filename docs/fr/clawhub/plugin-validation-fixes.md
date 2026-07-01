---
read_when:
    - Vous avez exécuté clawhub package validate et devez corriger les constats du plugin
    - ClawHub a rejeté la publication d’un package Plugin ou a émis un avertissement à son sujet
    - Vous mettez à jour les métadonnées du package du plugin avant la publication
summary: Corriger les problèmes de validation du package de Plugin ClawHub avant publication
title: Correctifs de validation des Plugins
x-i18n:
    generated_at: "2026-07-01T12:57:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correctifs de validation des Plugins

ClawHub valide les paquets de Plugins avant publication et peut aussi afficher les constatations issues des analyses automatisées de paquets. Cette page couvre les constatations destinées aux auteurs, c’est-à-dire celles que l’auteur du Plugin peut corriger dans les métadonnées de son paquet, son manifeste, ses imports SDK ou son artefact publié.

Elle ne couvre pas les constatations de couverture internes de Plugin Inspector. Si un rapport complet contient des codes de maintenance du scanner sans consignes de correction pour l’auteur, ils sont destinés aux mainteneurs d’OpenClaw plutôt qu’aux auteurs de Plugins.

Après avoir appliqué un correctif, relancez :

```bash
clawhub package validate <path-to-plugin>
```

## Constatations destinées aux auteurs

| Code                                    | Commencez ici                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Ajouter les métadonnées du paquet](/fr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Ajouter le bloc openclaw du paquet](/fr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Déclarer les points d’entrée de paquet OpenClaw](/fr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publier le point d’entrée déclaré](/fr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Compléter les métadonnées d’installation](/fr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Déclarer la compatibilité de l’API Plugin](/fr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Aligner la version minimale de l’hôte](/fr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Aligner les versions du paquet et du manifeste](/fr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Supprimer les métadonnées de paquet OpenClaw non prises en charge](/fr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendre l’artefact npm empaquetable](/fr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Inclure les points d’entrée dans la sortie npm pack](/fr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Inclure les métadonnées dans la sortie npm pack](/fr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Ajouter un nom d’affichage au manifeste](/fr/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Supprimer les champs de manifeste non pris en charge](/fr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Supprimer les clés de contrat non prises en charge](/fr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Remplacer les imports SDK racine](/fr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Supprimer les imports SDK réservés](/fr/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Remplacer l’accès au magasin de session complet](/fr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Remplacer les écritures dans le magasin de session complet](/fr/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Remplacer les assistants de chemins de fichiers de session](/fr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Remplacer les anciennes cibles de fichiers de transcription](/fr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Remplacer les assistants de transcription de bas niveau](/fr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Remplacer before_agent_start](/fr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Déplacer les variables d’environnement du fournisseur vers les métadonnées de configuration](/fr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Dupliquer les variables d’environnement du canal dans les métadonnées actuelles](/fr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Supprimer les références aux schémas de manifeste de sécurité indisponibles](/fr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Supprimer les fichiers de manifeste de sécurité non pris en charge](/fr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Métadonnées du paquet

### package-json-missing

La racine du paquet ne contient pas `package.json`, ClawHub ne peut donc pas identifier le paquet npm, sa version, ses points d’entrée ni ses métadonnées OpenClaw.

- Ajoutez `package.json` avec `name`, `version` et `type`.
- Ajoutez un bloc `openclaw` lorsque le paquet livre un Plugin OpenClaw.
- Utilisez [Créer des Plugins](/fr/plugins/building-plugins) pour un exemple minimal de paquet et [Manifeste de Plugin](/fr/plugins/manifest#manifest-versus-packagejson) pour la séparation entre paquet et manifeste.
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Le paquet possède `package.json`, mais il ne déclare pas de métadonnées de paquet OpenClaw.

- Ajoutez `package.json#openclaw`.
- Incluez des métadonnées de point d’entrée telles que `openclaw.extensions` ou `openclaw.runtimeExtensions`.
- Ajoutez les métadonnées de compatibilité et d’installation lorsque le paquet sera publié ou installé via ClawHub.
- Consultez [champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Les métadonnées du paquet existent, mais elles ne déclarent pas de point d’entrée d’exécution OpenClaw.

- Ajoutez `openclaw.extensions` pour les points d’entrée de Plugins natifs.
- Ajoutez `openclaw.runtimeExtensions` lorsque le paquet publié doit charger le JavaScript compilé.
- Conservez tous les chemins de points d’entrée dans le répertoire du paquet.
- Consultez [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints) et [champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Le paquet déclare un point d’entrée OpenClaw, mais le fichier référencé est absent du paquet en cours de validation.

- Vérifiez chaque chemin dans `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` et `openclaw.runtimeSetupEntry`.
- Construisez le paquet si le point d’entrée est généré dans `dist`.
- Mettez à jour les métadonnées si le point d’entrée a été déplacé.
- Consultez [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub ne peut pas déterminer comment le paquet doit être installé ou mis à jour.

- Renseignez `openclaw.install` avec la source d’installation prise en charge, par exemple `clawhubSpec`, `npmSpec` ou `localPath`.
- Définissez `openclaw.install.defaultChoice` lorsque plusieurs sources d’installation sont disponibles.
- Utilisez `openclaw.install.minHostVersion` pour la version minimale de l’hôte OpenClaw.
- Consultez [champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Le paquet ne déclare pas la plage d’API Plugin OpenClaw qu’il prend en charge.

- Ajoutez `openclaw.compat.pluginApi` à `package.json`.
- Utilisez la version de l’API Plugin OpenClaw ou le plancher semver avec lequel vous avez construit et testé.
- Gardez cette valeur distincte de la version du paquet. La version du paquet décrit la publication du Plugin ; `openclaw.compat.pluginApi` décrit le contrat d’API de l’hôte.
- Consultez [champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La version minimale de l’hôte indiquée par le paquet ne correspond pas aux métadonnées de version OpenClaw avec lesquelles le paquet a été construit.

- Vérifiez `openclaw.install.minHostVersion`.
- Vérifiez toute métadonnée de build OpenClaw dans le paquet, par exemple la version d’OpenClaw utilisée pendant la publication.
- Alignez la version minimale de l’hôte sur la plage de versions d’hôte réellement prise en charge par le paquet.
- Consultez [champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La version du paquet et la version du manifeste du Plugin ne correspondent pas.

- Préférez `package.json#version` comme version de publication du paquet.
- Si `openclaw.plugin.json` possède aussi `version`, mettez-la à jour pour qu’elle corresponde ou supprimez les métadonnées de version de manifeste obsolètes lorsque les métadonnées du paquet font autorité.
- Publiez une nouvelle version du paquet après avoir modifié des métadonnées publiées.
- Consultez [Manifeste de Plugin](/fr/plugins/manifest).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Le bloc `package.json#openclaw` contient des champs qui ne sont pas pris en charge comme métadonnées de paquet OpenClaw.

- Supprimez les champs non pris en charge tels que `openclaw.bundle`.
- Conservez les métadonnées de Plugins natifs dans `openclaw.plugin.json`.
- Conservez les points d’entrée de paquet, la compatibilité, l’installation, la configuration et les métadonnées de catalogue dans les champs `package.json#openclaw` pris en charge.
- Consultez [champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

## Artefact publié

### package-npm-pack-unavailable

Le paquet ne peut pas être empaqueté dans l’artefact que ClawHub inspecterait ou publierait.

- Exécutez `npm pack --dry-run` depuis la racine du paquet.
- Corrigez les métadonnées de paquet invalides, les scripts de cycle de vie cassés ou les entrées de fichiers qui font échouer l’empaquetage.
- Supprimez `private: true` si ce paquet est destiné à une publication publique.
- Relancez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Le paquet peut être empaqueté, mais l’artefact empaqueté n’inclut pas les fichiers de point d’entrée déclarés dans `package.json#openclaw`.

- Exécutez `npm pack --dry-run` et inspectez les fichiers qui seraient inclus.
- Construisez les points d’entrée générés avant l’empaquetage.
- Mettez à jour `files`, `.npmignore` ou la sortie de build afin que les points d’entrée déclarés soient inclus.
- Consultez [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Il manque à l’artefact empaqueté des métadonnées OpenClaw présentes dans votre paquet source.

- Exécutez `npm pack --dry-run` et inspectez les fichiers de métadonnées inclus.
- Assurez-vous que `package.json` inclut le bloc `openclaw` dans l’artefact empaqueté.
- Assurez-vous que `openclaw.plugin.json` est inclus lorsque le paquet est un Plugin OpenClaw natif.
- Mettez à jour `files` ou `.npmignore` afin que les métadonnées du paquet ne soient pas exclues.
- Consultez [Créer des Plugins](/fr/plugins/building-plugins).
- Relancez `clawhub package validate <path-to-plugin>`.

## Métadonnées du manifeste

### manifest-name-missing

Le manifeste natif du plugin n’inclut pas de nom d’affichage.

- Ajoutez un champ `name` non vide à `openclaw.plugin.json`.
- Gardez `name` lisible par un humain et gardez `id` comme identifiant machine stable.
- Voir [Manifeste de Plugin](/fr/plugins/manifest).
- Relancez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Le manifeste du plugin comporte des champs de premier niveau qu’OpenClaw ne prend pas en charge.

- Comparez chaque champ de premier niveau avec la
  [référence des champs du manifeste](/fr/plugins/manifest#top-level-field-reference).
- Supprimez les champs personnalisés de `openclaw.plugin.json`.
- Déplacez plutôt les métadonnées de package ou d’installation vers les champs
  `package.json#openclaw` pris en charge.
- Relancez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Le manifeste déclare des clés non prises en charge dans `contracts`.

- Comparez chaque clé sous `contracts` avec la
  [référence des contrats](/fr/plugins/manifest#contracts-reference).
- Supprimez les clés de contrat non prises en charge.
- Déplacez le comportement d’exécution dans le code d’enregistrement du plugin, et limitez `contracts`
  aux métadonnées statiques de propriété des capacités.
- Relancez `clawhub package validate <path-to-plugin>`.

## SDK et migration de compatibilité

### legacy-root-sdk-import

Le plugin importe depuis le barrel racine obsolète du SDK :
`openclaw/plugin-sdk`.

- Remplacez les importations du barrel racine par des importations de sous-chemins publics ciblés.
- Utilisez `openclaw/plugin-sdk/plugin-entry` pour `definePluginEntry`.
- Utilisez `openclaw/plugin-sdk/channel-core` pour les assistants d’entrée de canal.
- Utilisez les [conventions d’importation](/fr/plugins/building-plugins#import-conventions) et
  les [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths) pour trouver l’importation restreinte.
- Relancez `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Le plugin importe un chemin du SDK réservé aux plugins groupés ou à la compatibilité
interne.

- Remplacez les importations internes réservées du SDK OpenClaw par des sous-chemins publics documentés
  `openclaw/plugin-sdk/*`.
- Si le comportement n’a pas de SDK public, gardez l’assistant dans votre package ou
  demandez une API OpenClaw publique.
- Utilisez les [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths) et la
  [migration du SDK](/fr/plugins/sdk-migration) pour choisir une importation prise en charge.
- Relancez `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Le plugin utilise encore l’assistant obsolète de magasin de session complet
`loadSessionStore`.

- Utilisez `getSessionEntry(...)` ou `listSessionEntries(...)` lors de la lecture de l’état
  de session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` lors de l’écriture de l’état
  de session.
- Évitez de charger, modifier et enregistrer tout l’objet du magasin de session.
- Conservez `loadSessionStore(...)` uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge les anciennes versions d’OpenClaw qui l’exigent.
- Voir [API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Relancez `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Le plugin utilise encore un assistant obsolète d’écriture du magasin de session complet, comme
`saveSessionStore` ou `updateSessionStore`.

- Utilisez `patchSessionEntry(...)` lors de la mise à jour de champs sur une entrée de session
  existante.
- Utilisez `upsertSessionEntry(...)` lors du remplacement ou de la création d’une entrée de session.
- Évitez de charger, modifier et enregistrer tout l’objet du magasin de session.
- Conservez les assistants d’écriture de magasin complet uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge les anciennes versions d’OpenClaw qui les exigent.
- Voir [API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Relancez `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Le plugin utilise encore des assistants obsolètes de chemins de fichiers de session, comme
`resolveSessionFilePath` ou `resolveAndPersistSessionFile`.

- Utilisez `getSessionEntry(...)` pour lire les métadonnées de session par agent et identité
  de session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` pour persister les métadonnées
  de session.
- Utilisez l’identité de transcription ou les assistants de cible lorsque le code prépare une
  opération de transcription.
- Ne persistez pas et ne dépendez pas des anciens chemins de fichiers de transcription.
- Voir [API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Relancez `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Le plugin utilise encore l’assistant obsolète de cible de fichier de transcription
`resolveSessionTranscriptLegacyFileTarget`.

- Utilisez `resolveSessionTranscriptIdentity(...)` lorsque le code n’a besoin que de l’identité publique
  de la session.
- Utilisez `resolveSessionTranscriptTarget(...)` lorsque le code a besoin d’une cible structurée
  d’opération de transcription.
- Évitez de lire ou de construire directement des anciennes cibles de fichiers de transcription.
- Conservez l’ancien assistant uniquement tant que votre plage de compatibilité déclarée prend encore
  en charge les anciennes versions d’OpenClaw qui l’exigent.
- Voir [API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Relancez `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Le plugin utilise encore des assistants obsolètes de bas niveau pour les transcriptions, comme
`appendSessionTranscriptMessage` ou `emitSessionTranscriptUpdate`.

- Utilisez `appendSessionTranscriptMessageByIdentity(...)` pour les ajouts à la transcription.
- Utilisez `publishSessionTranscriptUpdateByIdentity(...)` pour les notifications de mise à jour
  de transcription.
- Préférez la surface d’exécution structurée des transcriptions afin qu’OpenClaw puisse appliquer les
  bonnes limites de transaction et la bonne gestion d’identité.
- Conservez les assistants de transcription de bas niveau uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge les anciennes versions d’OpenClaw qui les exigent.
- Voir [API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et
  [sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).
- Relancez `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Le plugin utilise encore l’ancien hook `before_agent_start`.

- Déplacez le travail de remplacement du modèle ou du fournisseur vers `before_model_resolve`.
- Déplacez le travail de mutation du prompt ou du contexte vers `before_prompt_build`.
- Conservez `before_agent_start` uniquement tant que votre plage de compatibilité déclarée prend encore
  en charge les anciennes versions d’OpenClaw qui l’exigent.
- Voir [Hooks](/fr/plugins/hooks) et
  [Compatibilité des Plugins](/fr/plugins/compatibility).
- Relancez `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Le manifeste utilise encore les anciennes métadonnées d’authentification de fournisseur `providerAuthEnvVars`.

- Répliquez les métadonnées de variables d’environnement du fournisseur dans `setup.providers[].envVars`.
- Conservez `providerAuthEnvVars` uniquement comme métadonnées de compatibilité tant que votre plage
  OpenClaw prise en charge en a encore besoin.
- Voir [référence de setup](/fr/plugins/manifest#setup-reference) et
  [migration du SDK](/fr/plugins/sdk-migration).
- Relancez `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Le manifeste utilise d’anciennes métadonnées de variables d’environnement de canal, ou des métadonnées plus anciennes, sans les métadonnées
actuelles de setup ou de configuration attendues par ClawHub.

- Gardez les métadonnées de variables d’environnement de canal déclaratives afin qu’OpenClaw puisse inspecter l’état du setup
  sans charger l’exécution du canal.
- Répliquez le setup de canal piloté par variables d’environnement dans les métadonnées actuelles de setup, de configuration de canal ou
  de canal de package utilisées par la forme de votre plugin.
- Conservez `channelEnvVars` uniquement comme métadonnées de compatibilité tant que les anciennes versions prises en charge
  d’OpenClaw l’exigent encore.
- Voir [Manifeste de Plugin](/fr/plugins/manifest) et
  [Plugins de canal](/fr/plugins/sdk-channel-plugins).
- Relancez `clawhub package validate <path-to-plugin>`.

## Manifeste de sécurité

### security-manifest-schema-unavailable

Le package fournit `openclaw.security.json` avec une référence de schéma que ClawHub
ne reconnaît pas comme disponible.

- Supprimez l’URL du schéma si elle est uniquement indicative.
- Utilisez un schéma versionné documenté uniquement après qu’OpenClaw en publie un.
- Relancez `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Le package fournit un fichier de manifeste de sécurité non pris en charge.

- Supprimez `openclaw.security.json` jusqu’à ce qu’OpenClaw documente un schéma de manifeste de sécurité
  versionné et le comportement de ClawHub.
- Gardez le comportement sensible à la sécurité documenté dans la documentation publique de votre package ou
  le README jusqu’à ce que le contrat du manifeste existe.
- Relancez `clawhub package validate <path-to-plugin>`.

## Connexe

- [CLI ClawHub](/fr/clawhub/cli)
- [Publication ClawHub](/fr/clawhub/publishing)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Manifeste de Plugin](/fr/plugins/manifest)
- [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints)
- [Compatibilité des Plugins](/fr/plugins/compatibility)
