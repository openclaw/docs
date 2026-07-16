---
read_when:
    - Vous avez exécuté `clawhub package validate` et devez corriger les problèmes détectés dans le plugin
    - ClawHub a rejeté ou signalé un avertissement lors de la publication d’un paquet de Plugin
    - Vous mettez à jour les métadonnées du paquet du plugin avant la publication
summary: Corriger les problèmes de validation des paquets de Plugin ClawHub avant la publication
title: Correctifs de validation des Plugins
x-i18n:
    generated_at: "2026-07-16T13:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correctifs de validation des plugins

ClawHub valide les paquets de plugins avant leur publication et peut également afficher les résultats
d’analyses automatisées des paquets. Cette page couvre les résultats destinés aux auteurs, c’est-à-dire
ceux que l’auteur du plugin peut corriger dans les métadonnées de son paquet, son manifeste, ses
imports du SDK ou l’artefact publié.

Elle ne couvre pas les résultats internes de couverture de Plugin Inspector. Si un rapport complet
contient des codes de maintenance de l’analyseur sans consignes de correction destinées aux auteurs,
ils concernent les responsables de maintenance d’OpenClaw plutôt que les auteurs de plugins.

Après avoir appliqué un correctif, réexécutez :

```bash
clawhub package validate <path-to-plugin>
```

## Résultats destinés aux auteurs

| Code                                    | Commencez ici                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Ajouter les métadonnées du paquet](/fr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Ajouter le bloc openclaw du paquet](/fr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Déclarer les points d’entrée du paquet OpenClaw](/fr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publier le point d’entrée déclaré](/fr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Compléter les métadonnées d’installation](/fr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Déclarer la compatibilité de l’API du plugin](/fr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Aligner la version minimale de l’hôte](/fr/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Aligner les versions du paquet et du manifeste](/fr/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Supprimer les métadonnées de paquet OpenClaw non prises en charge](/fr/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Rendre l’artefact npm empaquetable](/fr/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Inclure les points d’entrée dans la sortie de npm pack](/fr/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Inclure les métadonnées dans la sortie de npm pack](/fr/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Ajouter un nom d’affichage au manifeste](/fr/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Supprimer les champs de manifeste non pris en charge](/fr/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Supprimer les clés de contrat non prises en charge](/fr/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Remplacer les imports racine du SDK](/fr/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Supprimer les imports réservés du SDK](/fr/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Remplacer l’accès au magasin de sessions complet](/fr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Remplacer les écritures dans le magasin de sessions complet](/fr/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Remplacer les utilitaires de chemins de fichiers de session](/fr/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Remplacer les anciennes cibles de fichiers de transcription](/fr/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Remplacer les utilitaires de bas niveau pour les transcriptions](/fr/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Remplacer before_agent_start](/fr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Déplacer les variables d’environnement du fournisseur vers les métadonnées de configuration](/fr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Reproduire les variables d’environnement du canal dans les métadonnées actuelles](/fr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Supprimer les références indisponibles au schéma du manifeste de sécurité](/fr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Supprimer les fichiers de manifeste de sécurité non pris en charge](/fr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Métadonnées du paquet

### package-json-missing

La racine du paquet ne contient pas `package.json`, ClawHub ne peut donc pas identifier le
paquet npm, sa version, ses points d’entrée ni ses métadonnées OpenClaw.

- Ajoutez `package.json` avec `name`, `version` et `type`.
- Ajoutez un bloc `openclaw` lorsque le paquet fournit un plugin OpenClaw.
- Consultez [Création de plugins](/fr/plugins/building-plugins) pour obtenir un exemple
  de paquet minimal et [Manifeste de plugin](/fr/plugins/manifest#manifest-versus-packagejson)
  pour comprendre la distinction entre paquet et manifeste.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Le paquet contient `package.json`, mais ne déclare pas les métadonnées de
paquet OpenClaw.

- Ajoutez `package.json#openclaw`.
- Incluez les métadonnées de point d’entrée, telles que `openclaw.extensions` ou
  `openclaw.runtimeExtensions`.
- Ajoutez les métadonnées de compatibilité et d’installation lorsque le paquet doit être publié ou
  installé via ClawHub.
- Consultez [Champs de package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Les métadonnées du paquet existent, mais elles ne déclarent aucun point d’entrée
d’exécution OpenClaw.

- Ajoutez `openclaw.extensions` pour les points d’entrée de plugins natifs.
- Ajoutez `openclaw.runtimeExtensions` lorsque le paquet publié doit charger du
  JavaScript compilé.
- Conservez tous les chemins des points d’entrée dans le répertoire du paquet.
- Consultez [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints) et
  [Champs de package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Le paquet déclare un point d’entrée OpenClaw, mais le fichier référencé est absent
du paquet en cours de validation.

- Vérifiez chaque chemin dans `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` et `openclaw.runtimeSetupEntry`.
- Compilez le paquet si le point d’entrée est généré dans `dist`.
- Mettez à jour les métadonnées si le point d’entrée a été déplacé.
- Consultez [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub ne peut pas déterminer comment le paquet doit être installé ou mis à jour.

- Renseignez `openclaw.install` avec la source d’installation prise en charge, telle que
  `clawhubSpec`, `npmSpec` ou `localPath`.
- Définissez `openclaw.install.defaultChoice` lorsque plusieurs sources d’installation sont
  disponibles.
- Utilisez `openclaw.install.minHostVersion` pour la version minimale de l’hôte OpenClaw.
- Consultez [Champs de package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Le paquet ne déclare pas la plage de versions de l’API de plugin OpenClaw qu’il prend en charge.

- Ajoutez `openclaw.compat.pluginApi` à `package.json`.
- Utilisez la version de l’API de plugin OpenClaw ou la version minimale semver avec laquelle vous avez
  développé et effectué vos tests.
- Maintenez cette valeur distincte de la version du paquet. La version du paquet décrit la
  version publiée du plugin ; `openclaw.compat.pluginApi` décrit le contrat de l’API de l’hôte.
- Consultez [Champs de package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La version minimale de l’hôte du paquet ne correspond pas aux métadonnées de version
OpenClaw avec lesquelles le paquet a été développé.

- Vérifiez `openclaw.install.minHostVersion`.
- Vérifiez toutes les métadonnées de compilation OpenClaw du paquet, telles que la version d’OpenClaw
  utilisée lors de la publication.
- Alignez la version minimale de l’hôte sur la plage de versions de l’hôte réellement
  prise en charge par le paquet.
- Consultez [Champs de package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La version du paquet et celle du manifeste du plugin ne correspondent pas.

- Utilisez de préférence `package.json#version` comme version publiée du paquet.
- Si `openclaw.plugin.json` contient également `version`, mettez-le à jour pour qu’il corresponde ou supprimez
  les métadonnées de version obsolètes du manifeste lorsque les métadonnées du paquet font autorité.
- Publiez une nouvelle version du paquet après avoir modifié les métadonnées publiées.
- Consultez [Manifeste de plugin](/fr/plugins/manifest).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Le bloc `package.json#openclaw` contient des champs qui ne sont pas des métadonnées de
paquet OpenClaw prises en charge.

- Supprimez les champs non pris en charge tels que `openclaw.bundle`.
- Conservez les métadonnées des plugins natifs dans `openclaw.plugin.json`.
- Conservez les points d’entrée, la compatibilité, l’installation, la configuration et les métadonnées de catalogue
  du paquet dans les champs `package.json#openclaw` pris en charge.
- Consultez [Champs de package.json qui influencent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Artefact publié

### package-npm-pack-unavailable

Le paquet ne peut pas être empaqueté dans l’artefact que ClawHub inspecterait ou
publierait.

- Exécutez `npm pack --dry-run` depuis la racine du paquet.
- Corrigez les métadonnées de paquet non valides, les scripts de cycle de vie défectueux ou les entrées de fichiers qui
  empêchent l’empaquetage.
- Supprimez `private: true` si ce paquet est destiné à une publication publique.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Le paquet peut être empaqueté, mais l’artefact empaqueté ne contient pas les
fichiers de point d’entrée déclarés dans `package.json#openclaw`.

- Exécutez `npm pack --dry-run` et examinez les fichiers qui seraient inclus.
- Compilez les points d’entrée générés avant l’empaquetage.
- Mettez à jour `files`, `.npmignore` ou la sortie de compilation afin que les points d’entrée déclarés soient
  inclus.
- Consultez [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Les métadonnées OpenClaw présentes dans votre paquet source sont absentes de
l’artefact empaqueté.

- Exécutez `npm pack --dry-run` et inspectez les fichiers de métadonnées inclus.
- Vérifiez que `package.json` inclut le bloc `openclaw` dans l’artefact empaqueté.
- Vérifiez que `openclaw.plugin.json` est inclus lorsque le paquet est un plugin
  OpenClaw natif.
- Mettez à jour `files` ou `.npmignore` afin que les métadonnées du paquet ne soient pas exclues.
- Consultez [Création de plugins](/fr/plugins/building-plugins).
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Métadonnées du manifeste

### manifest-name-missing

Le manifeste du plugin natif ne contient pas de nom d’affichage.

- Ajoutez un champ `name` non vide à `openclaw.plugin.json`.
- Veillez à ce que `name` soit lisible par l’utilisateur et conservez `id` comme identifiant machine stable.
- Consultez [Manifeste de plugin](/fr/plugins/manifest).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Le manifeste du plugin comporte des champs de premier niveau qu’OpenClaw ne prend pas en charge.

- Comparez chaque champ de premier niveau avec la
  [référence des champs du manifeste](/fr/plugins/manifest#top-level-field-reference).
- Supprimez les champs personnalisés de `openclaw.plugin.json`.
- Placez plutôt les métadonnées du paquet ou de l’installation dans les champs `package.json#openclaw`
  pris en charge, et non dans le manifeste.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Le manifeste déclare des clés non prises en charge dans `contracts`.

- Comparez chaque clé sous `contracts` avec la
  [référence des contrats](/fr/plugins/manifest#contracts-reference).
- Supprimez les clés de contrat non prises en charge.
- Déplacez le comportement d’exécution dans le code d’enregistrement du plugin et limitez `contracts`
  aux métadonnées statiques de propriété des capacités.
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Migration du SDK et de la compatibilité

### legacy-root-sdk-import

Le plugin effectue des importations depuis le module d’exportation racine obsolète du SDK :
`openclaw/plugin-sdk`.

- Remplacez les importations depuis le module d’exportation racine par des importations ciblées depuis des sous-chemins publics.
- Utilisez `openclaw/plugin-sdk/plugin-entry` pour `definePluginEntry`.
- Utilisez `openclaw/plugin-sdk/channel-core` pour les utilitaires de point d’entrée des canaux.
- Consultez les [Conventions d’importation](/fr/plugins/building-plugins#import-conventions) et les
  [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths) pour trouver l’importation ciblée.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Le plugin importe un chemin du SDK réservé aux plugins intégrés ou à la
compatibilité interne.

- Remplacez les importations internes réservées du SDK OpenClaw par des sous-chemins
  `openclaw/plugin-sdk/*` publics et documentés.
- Si ce comportement ne dispose d’aucun SDK public, conservez l’utilitaire dans votre paquet ou
  demandez une API OpenClaw publique.
- Consultez les [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths) et la
  [Migration du SDK](/fr/plugins/sdk-migration) pour choisir une importation prise en charge.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Le plugin utilise encore l’utilitaire obsolète qui charge l’intégralité du stockage des sessions
`loadSessionStore`.

- Utilisez `getSessionEntry(...)` ou `listSessionEntries(...)` lors de la lecture de l’état
  d’une session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` lors de l’écriture de l’état
  d’une session.
- Évitez de charger, de modifier et d’enregistrer l’intégralité de l’objet de stockage des sessions.
- Conservez `loadSessionStore(...)` uniquement tant que la plage de compatibilité déclarée
  prend encore en charge les anciennes versions d’OpenClaw qui l’exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Le plugin utilise encore un utilitaire d’écriture obsolète portant sur l’intégralité du stockage des sessions, tel que
`saveSessionStore` ou `updateSessionStore`.

- Utilisez `patchSessionEntry(...)` lors de la mise à jour des champs d’une entrée de session
  existante.
- Utilisez `upsertSessionEntry(...)` lors du remplacement ou de la création d’une entrée de session.
- Évitez de charger, de modifier et d’enregistrer l’intégralité de l’objet de stockage des sessions.
- Conservez les utilitaires d’écriture portant sur l’intégralité du stockage uniquement tant que la plage de compatibilité déclarée
  prend encore en charge les anciennes versions d’OpenClaw qui les exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Le plugin utilise encore des utilitaires obsolètes de chemin de fichier de session, tels que
`resolveSessionFilePath` ou `resolveAndPersistSessionFile`.

- Utilisez `getSessionEntry(...)` pour lire les métadonnées de session selon l’identité de l’agent et de la session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` pour conserver les métadonnées
  de session.
- Utilisez les utilitaires d’identité ou de cible de transcription lorsque le code prépare une
  opération de transcription.
- Ne conservez pas les anciens chemins de fichiers de transcription et n’en dépendez pas.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Le plugin utilise encore l’utilitaire obsolète de cible de fichier de transcription
`resolveSessionTranscriptLegacyFileTarget`.

- Utilisez `resolveSessionTranscriptIdentity(...)` lorsque le code a uniquement besoin de l’identité
  publique de la session.
- Utilisez `resolveSessionTranscriptTarget(...)` lorsque le code a besoin d’une cible structurée
  d’opération de transcription.
- Évitez de lire ou de construire directement les anciennes cibles de fichiers de transcription.
- Conservez l’ancien utilitaire uniquement tant que la plage de compatibilité déclarée prend encore
  en charge les anciennes versions d’OpenClaw qui l’exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Le plugin utilise encore des utilitaires de transcription de bas niveau obsolètes, tels que
`appendSessionTranscriptMessage` ou `emitSessionTranscriptUpdate`.

- Utilisez `appendSessionTranscriptMessageByIdentity(...)` pour ajouter des éléments aux transcriptions.
- Utilisez `publishSessionTranscriptUpdateByIdentity(...)` pour les notifications de mise à jour
  des transcriptions.
- Privilégiez l’interface d’exécution structurée des transcriptions afin qu’OpenClaw puisse appliquer les
  limites de transaction et la gestion des identités appropriées.
- Conservez les utilitaires de transcription de bas niveau uniquement tant que la plage de compatibilité déclarée
  prend encore en charge les anciennes versions d’OpenClaw qui les exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Le plugin utilise encore l’ancien hook `before_agent_start`.

- Déplacez les opérations de remplacement du modèle ou du fournisseur vers `before_model_resolve`.
- Déplacez les opérations de modification du prompt ou du contexte vers `before_prompt_build`.
- Conservez `before_agent_start` uniquement tant que la plage de compatibilité déclarée prend encore
  en charge les anciennes versions d’OpenClaw qui l’exigent.
- Consultez les [Hooks](/fr/plugins/hooks) et la
  [Compatibilité des plugins](/fr/plugins/compatibility).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Le manifeste utilise encore les anciennes métadonnées d’authentification du fournisseur `providerAuthEnvVars`.

- Reproduisez les métadonnées des variables d’environnement du fournisseur dans `setup.providers[].envVars`.
- Conservez `providerAuthEnvVars` uniquement comme métadonnées de compatibilité tant que la plage
  OpenClaw prise en charge en a encore besoin.
- Consultez la [référence de configuration](/fr/plugins/manifest#setup-reference) et la
  [Migration du SDK](/fr/plugins/sdk-migration).
- Réexécutez `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Le manifeste utilise des métadonnées anciennes ou obsolètes de variables d’environnement de canal sans les métadonnées
de configuration actuelles attendues par ClawHub.

- Conservez les métadonnées des variables d’environnement du canal sous forme déclarative afin qu’OpenClaw puisse inspecter l’état de la configuration
  sans charger l’environnement d’exécution du canal.
- Reproduisez la configuration du canal pilotée par les variables d’environnement dans les métadonnées actuelles de configuration, de canal ou
  de canal du paquet utilisées par la structure de votre plugin.
- Conservez `channelEnvVars` uniquement comme métadonnées de compatibilité tant que les anciennes versions
  d’OpenClaw prises en charge l’exigent encore.
- Consultez le [Manifeste de plugin](/fr/plugins/manifest) et les
  [Plugins de canal](/fr/plugins/sdk-channel-plugins).
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Manifeste de sécurité

### security-manifest-schema-unavailable

Le paquet fournit `openclaw.security.json` avec une référence de schéma que ClawHub
ne reconnaît pas comme disponible.

- Supprimez l’URL du schéma si elle est uniquement indicative.
- N’utilisez un schéma versionné documenté qu’après sa publication par OpenClaw.
- Réexécutez `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Le paquet fournit un fichier de manifeste de sécurité non pris en charge.

- Supprimez `openclaw.security.json` jusqu’à ce qu’OpenClaw documente un schéma versionné de manifeste de sécurité
  et le comportement de ClawHub.
- Documentez les comportements sensibles en matière de sécurité dans la documentation publique de votre paquet ou
  dans son README jusqu’à ce que le contrat du manifeste existe.
- Réexécutez `clawhub package validate <path-to-plugin>`.

## Ressources connexes

- [CLI de ClawHub](/fr/clawhub/cli)
- [Publication sur ClawHub](/fr/clawhub/publishing)
- [Création de plugins](/fr/plugins/building-plugins)
- [Manifeste de plugin](/fr/plugins/manifest)
- [Points d’entrée des plugins](/fr/plugins/sdk-entrypoints)
- [Compatibilité des plugins](/fr/plugins/compatibility)
