---
read_when:
    - Vous avez exécuté clawhub package validate et devez corriger les constats du Plugin
    - ClawHub a rejeté ou émis un avertissement lors de la publication d’un package de Plugin
    - Vous mettez à jour les métadonnées du package Plugin avant la publication
summary: Corriger les constats de validation du package du Plugin ClawHub avant publication
title: Correctifs de validation des Plugins
x-i18n:
    generated_at: "2026-06-28T05:07:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Corrections de validation des Plugins

ClawHub valide les paquets de Plugin avant publication et peut aussi afficher les constats issus des
analyses automatisées de paquets. Cette page couvre les constats destinés aux auteurs, c’est-à-dire
les constats que l’auteur du Plugin peut corriger dans les métadonnées de son paquet, son manifeste, ses imports SDK
ou son artefact publié.

Elle ne couvre pas les constats internes de couverture du Plugin Inspector. Si un rapport complet
contient des codes de maintenance du scanner sans consignes de remédiation pour l’auteur, ceux-ci
s’adressent aux mainteneurs OpenClaw plutôt qu’aux auteurs de Plugins.

Après avoir appliqué une correction, relancez :

```bash
clawhub package validate <path-to-plugin>
```

## Constats destinés aux auteurs

| Code                                    | Commencer ici                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Ajouter les métadonnées du paquet](/fr/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Ajouter le bloc openclaw du paquet](/fr/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Déclarer les points d’entrée de paquet OpenClaw](/fr/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publier le point d’entrée déclaré](/fr/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Compléter les métadonnées d’installation](/fr/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Déclarer la compatibilité de l’API de Plugin](/fr/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
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
| `sdk-load-session-store`                | [Remplacer l’accès à l’ensemble du magasin de session](/fr/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [Remplacer before_agent_start](/fr/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Déplacer les variables d’environnement du fournisseur vers les métadonnées de configuration](/fr/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Refléter les variables d’environnement du canal dans les métadonnées actuelles](/fr/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Supprimer les références indisponibles au schéma de manifeste de sécurité](/fr/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Supprimer les fichiers de manifeste de sécurité non pris en charge](/fr/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Métadonnées du paquet

### package-json-missing

La racine du paquet n’inclut pas `package.json`, ClawHub ne peut donc pas identifier le
paquet npm, sa version, ses points d’entrée ni les métadonnées OpenClaw.

- Ajoutez `package.json` avec `name`, `version` et `type`.
- Ajoutez un bloc `openclaw` lorsque le paquet fournit un Plugin OpenClaw.
- Consultez [Créer des Plugins](/fr/plugins/building-plugins) pour un exemple minimal de paquet
  et [Manifeste de Plugin](/fr/plugins/manifest#manifest-versus-packagejson)
  pour la séparation entre paquet et manifeste.
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Le paquet possède `package.json`, mais il ne déclare pas de métadonnées de paquet
OpenClaw.

- Ajoutez `package.json#openclaw`.
- Incluez les métadonnées de point d’entrée telles que `openclaw.extensions` ou
  `openclaw.runtimeExtensions`.
- Ajoutez les métadonnées de compatibilité et d’installation lorsque le paquet sera publié ou
  installé via ClawHub.
- Consultez [Champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Les métadonnées du paquet existent, mais elles ne déclarent pas de point d’entrée
d’exécution OpenClaw.

- Ajoutez `openclaw.extensions` pour les points d’entrée de Plugin natifs.
- Ajoutez `openclaw.runtimeExtensions` lorsque le paquet publié doit charger du JavaScript
  compilé.
- Gardez tous les chemins de point d’entrée à l’intérieur du répertoire du paquet.
- Consultez [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints) et
  [Champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Le paquet déclare un point d’entrée OpenClaw, mais le fichier référencé est absent
du paquet en cours de validation.

- Vérifiez chaque chemin dans `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` et `openclaw.runtimeSetupEntry`.
- Compilez le paquet si le point d’entrée est généré dans `dist`.
- Mettez à jour les métadonnées si le point d’entrée a été déplacé.
- Consultez [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub ne peut pas déterminer comment le paquet doit être installé ou mis à jour.

- Renseignez `openclaw.install` avec la source d’installation prise en charge, comme
  `clawhubSpec`, `npmSpec` ou `localPath`.
- Définissez `openclaw.install.defaultChoice` lorsque plusieurs sources d’installation sont
  disponibles.
- Utilisez `openclaw.install.minHostVersion` pour la version minimale de l’hôte OpenClaw.
- Consultez [Champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Le paquet ne déclare pas la plage d’API de Plugin OpenClaw qu’il prend en charge.

- Ajoutez `openclaw.compat.pluginApi` à `package.json`.
- Utilisez la version de l’API de Plugin OpenClaw ou le plancher semver avec lequel vous avez développé et testé.
- Gardez cela distinct de la version du paquet. La version du paquet décrit la
  publication du Plugin ; `openclaw.compat.pluginApi` décrit le contrat d’API de l’hôte.
- Consultez [Champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

La version minimale de l’hôte du paquet ne correspond pas aux métadonnées de version OpenClaw
avec lesquelles le paquet a été construit.

- Vérifiez `openclaw.install.minHostVersion`.
- Vérifiez toute métadonnée de compilation OpenClaw dans le paquet, comme la version OpenClaw
  utilisée pendant la publication.
- Alignez la version minimale de l’hôte sur la plage de versions d’hôte que le paquet
  prend réellement en charge.
- Consultez [Champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

La version du paquet et la version du manifeste de Plugin ne concordent pas.

- Préférez `package.json#version` comme version de publication du paquet.
- Si `openclaw.plugin.json` possède également `version`, mettez-la à jour pour qu’elle corresponde, ou supprimez
  les métadonnées de version de manifeste obsolètes lorsque les métadonnées du paquet font autorité.
- Publiez une nouvelle version du paquet après avoir modifié des métadonnées publiées.
- Consultez [Manifeste de Plugin](/fr/plugins/manifest).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Le bloc `package.json#openclaw` contient des champs qui ne sont pas des métadonnées de paquet
OpenClaw prises en charge.

- Supprimez les champs non pris en charge comme `openclaw.bundle`.
- Gardez les métadonnées de Plugin natif dans `openclaw.plugin.json`.
- Gardez les points d’entrée, la compatibilité, l’installation, la configuration et les métadonnées de catalogue du paquet
  dans les champs `package.json#openclaw` pris en charge.
- Consultez [Champs package.json qui affectent la découverte](/fr/plugins/manifest#packagejson-fields-that-affect-discovery).
- Relancez `clawhub package validate <path-to-plugin>`.

## Artefact publié

### package-npm-pack-unavailable

Le paquet ne peut pas être empaqueté dans l’artefact que ClawHub inspecterait ou
publierait.

- Exécutez `npm pack --dry-run` depuis la racine du paquet.
- Corrigez les métadonnées de paquet invalides, les scripts de cycle de vie cassés ou les entrées de fichiers qui
  font échouer l’empaquetage.
- Supprimez `private: true` si ce paquet est destiné à une publication publique.
- Relancez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Le paquet peut être empaqueté, mais l’artefact empaqueté n’inclut pas les
fichiers de point d’entrée déclarés dans `package.json#openclaw`.

- Exécutez `npm pack --dry-run` et inspectez les fichiers qui seraient inclus.
- Compilez les points d’entrée générés avant l’empaquetage.
- Mettez à jour `files`, `.npmignore` ou la sortie de compilation afin que les points d’entrée déclarés soient
  inclus.
- Consultez [Points d’entrée de Plugin](/fr/plugins/sdk-entrypoints).
- Relancez `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

Il manque à l’artefact empaqueté des métadonnées OpenClaw qui existent dans votre paquet
source.

- Exécutez `npm pack --dry-run` et inspectez les fichiers de métadonnées inclus.
- Assurez-vous que `package.json` inclut le bloc `openclaw` dans l’artefact empaqueté.
- Assurez-vous que `openclaw.plugin.json` est inclus lorsque le paquet est un Plugin
  OpenClaw natif.
- Mettez à jour `files` ou `.npmignore` afin que les métadonnées du paquet ne soient pas exclues.
- Consultez [Créer des Plugins](/fr/plugins/building-plugins).
- Relancez `clawhub package validate <path-to-plugin>`.

## Métadonnées du manifeste

### manifest-name-missing

Le manifeste de Plugin natif n’inclut pas de nom d’affichage.

- Ajoutez un champ `name` non vide à `openclaw.plugin.json`.
- Gardez `name` lisible par les humains et gardez `id` comme identifiant machine stable.
- Consultez [Manifeste de Plugin](/fr/plugins/manifest).
- Relancez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Le manifeste du Plugin contient des champs de premier niveau qu’OpenClaw ne prend pas en charge.

- Comparez chaque champ de premier niveau avec la
  [référence des champs du manifeste](/fr/plugins/manifest#top-level-field-reference).
- Supprimez les champs personnalisés de `openclaw.plugin.json`.
- Déplacez les métadonnées de package ou d’installation dans les champs pris en charge de `package.json#openclaw`
  plutôt que dans le manifeste.
- Relancez `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Le manifeste déclare des clés non prises en charge dans `contracts`.

- Comparez chaque clé sous `contracts` avec la
  [référence des contrats](/fr/plugins/manifest#contracts-reference).
- Supprimez les clés de contrat non prises en charge.
- Déplacez le comportement d’exécution dans le code d’enregistrement du plugin, et limitez `contracts`
  aux métadonnées statiques de propriété des capacités.
- Relancez `clawhub package validate <path-to-plugin>`.

## Migration du SDK et de la compatibilité

### legacy-root-sdk-import

Le plugin importe depuis le barrel SDK racine obsolète :
`openclaw/plugin-sdk`.

- Remplacez les imports du barrel racine par des imports de sous-chemins publics ciblés.
- Utilisez `openclaw/plugin-sdk/plugin-entry` pour `definePluginEntry`.
- Utilisez `openclaw/plugin-sdk/channel-core` pour les helpers de point d’entrée de canal.
- Utilisez les [conventions d’import](/fr/plugins/building-plugins#import-conventions) et les
  [sous-chemins du Plugin SDK](/fr/plugins/sdk-subpaths) pour trouver l’import le plus précis.
- Relancez `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Le plugin importe un chemin SDK réservé aux plugins intégrés ou à la compatibilité
interne.

- Remplacez les imports SDK internes réservés d’OpenClaw par les sous-chemins publics documentés
  `openclaw/plugin-sdk/*`.
- Si le comportement ne dispose d’aucun SDK public, conservez le helper dans votre package ou
  demandez une API publique OpenClaw.
- Utilisez les [sous-chemins du Plugin SDK](/fr/plugins/sdk-subpaths) et la
  [migration du SDK](/fr/plugins/sdk-migration) pour choisir un import pris en charge.
- Relancez `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Le plugin utilise encore le helper obsolète de magasin de session complet
`loadSessionStore`.

- Utilisez `getSessionEntry(...)` ou `listSessionEntries(...)` lors de la lecture de l’état de session.
- Utilisez `patchSessionEntry(...)` ou `upsertSessionEntry(...)` lors de l’écriture de l’état de session.
- Évitez de charger, muter et enregistrer l’objet complet du magasin de session.
- Conservez `loadSessionStore(...)` uniquement tant que votre plage de compatibilité déclarée
  prend encore en charge d’anciennes versions d’OpenClaw qui l’exigent.
- Consultez l’[API d’exécution](/fr/plugins/sdk-runtime#agent-session-state) et les
  [sous-chemins du Plugin SDK](/fr/plugins/sdk-subpaths).
- Relancez `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Le plugin utilise encore le hook hérité `before_agent_start`.

- Déplacez le travail de remplacement de modèle ou de provider vers `before_model_resolve`.
- Déplacez le travail de mutation de prompt ou de contexte vers `before_prompt_build`.
- Conservez `before_agent_start` uniquement tant que votre plage de compatibilité déclarée prend encore
  en charge d’anciennes versions d’OpenClaw qui l’exigent.
- Consultez les [hooks](/fr/plugins/hooks) et la
  [compatibilité des plugins](/fr/plugins/compatibility).
- Relancez `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Le manifeste utilise encore les métadonnées héritées d’authentification de provider `providerAuthEnvVars`.

- Dupliquez les métadonnées de variables d’environnement du provider dans `setup.providers[].envVars`.
- Conservez `providerAuthEnvVars` uniquement comme métadonnées de compatibilité tant que votre plage
  OpenClaw prise en charge en a encore besoin.
- Consultez la [référence de setup](/fr/plugins/manifest#setup-reference) et la
  [migration du SDK](/fr/plugins/sdk-migration).
- Relancez `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Le manifeste utilise des métadonnées de variables d’environnement de canal héritées ou anciennes sans les métadonnées
de setup ou de configuration actuelles attendues par ClawHub.

- Gardez les métadonnées de variables d’environnement de canal déclaratives afin qu’OpenClaw puisse inspecter l’état du setup
  sans charger l’exécution du canal.
- Dupliquez le setup de canal piloté par les variables d’environnement dans les métadonnées actuelles de setup, de configuration de canal ou
  de canal de package utilisées par la forme de votre plugin.
- Conservez `channelEnvVars` uniquement comme métadonnées de compatibilité tant que les anciennes versions
  OpenClaw prises en charge l’exigent encore.
- Consultez le [manifeste de plugin](/fr/plugins/manifest) et les
  [plugins de canal](/fr/plugins/sdk-channel-plugins).
- Relancez `clawhub package validate <path-to-plugin>`.

## Manifeste de sécurité

### security-manifest-schema-unavailable

Le package fournit `openclaw.security.json` avec une référence de schéma que ClawHub
ne reconnaît pas comme disponible.

- Supprimez l’URL du schéma si elle est seulement indicative.
- Utilisez un schéma versionné documenté uniquement après qu’OpenClaw en publie un.
- Relancez `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Le package fournit un fichier de manifeste de sécurité non pris en charge.

- Supprimez `openclaw.security.json` jusqu’à ce qu’OpenClaw documente un schéma de manifeste de sécurité
  versionné et le comportement de ClawHub.
- Gardez le comportement sensible à la sécurité documenté dans la documentation publique de votre package ou
  dans le README jusqu’à ce que le contrat de manifeste existe.
- Relancez `clawhub package validate <path-to-plugin>`.

## Connexe

- [CLI ClawHub](/fr/clawhub/cli)
- [Publication ClawHub](/fr/clawhub/publishing)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Manifeste de plugin](/fr/plugins/manifest)
- [Points d’entrée de plugin](/fr/plugins/sdk-entrypoints)
- [Compatibilité des plugins](/fr/plugins/compatibility)
