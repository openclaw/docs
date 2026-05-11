---
read_when:
    - Vous développez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Exigences relatives au manifeste de Plugin et au schéma JSON (validation stricte de la configuration)
title: Manifeste du Plugin
x-i18n:
    generated_at: "2026-05-11T20:46:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

Cette page concerne uniquement le **manifeste de plugin OpenClaw natif**.

Pour les dispositions de bundles compatibles, consultez [Bundles de plugins](/fr/plugins/bundles).

Les formats de bundles compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition de composant Claude
  par défaut sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundles, mais elles ne sont pas validées
avec le schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut de
`settings.json` du bundle Claude, les valeurs par défaut LSP du bundle Claude et les packs de hooks
pris en charge lorsque la disposition correspond aux attentes du runtime OpenClaw.

Chaque plugin OpenClaw natif **doit** inclure un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme des
erreurs de plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles sur la compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Ce que fait ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit **avant de charger le
code de votre plugin**. Tout ce qui suit doit être suffisamment peu coûteux à inspecter sans démarrer
le runtime du plugin.

**Utilisez-le pour :**

- l’identité du plugin, la validation de la configuration et les indications d’interface de configuration
- les métadonnées d’authentification, d’intégration et de configuration initiale (alias, activation automatique, variables d’environnement de fournisseur, choix d’authentification)
- les indications d’activation pour les surfaces du plan de contrôle
- la propriété abrégée des familles de modèles
- les instantanés statiques de propriété des capacités (`contracts`)
- les métadonnées du lanceur QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration propres aux canaux, fusionnées dans le catalogue et les surfaces de validation

**Ne l’utilisez pas pour :** enregistrer un comportement de runtime, déclarer des points d’entrée de code
ou des métadonnées d’installation npm. Ceux-ci appartiennent au code de votre plugin et à `package.json`.

## Exemple minimal

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Exemple complet

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Référence des champs de premier niveau

| Champ                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                                       |
| ------------------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | ID canonique du plugin. C’est l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                                                             |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON en ligne pour la configuration de ce plugin.                                                                                                                                                                            |
| `enabledByDefault`                   | Non         | `true`                           | Marque un plugin groupé comme activé par défaut. Omettez-le, ou définissez n’importe quelle valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                                   |
| `enabledByDefaultOnPlatforms`        | Non         | `string[]`                       | Marque un plugin groupé comme activé par défaut uniquement sur les plateformes Node.js listées, par exemple `["darwin"]`. La configuration explicite reste prioritaire.                                                             |
| `legacyPluginIds`                    | Non         | `string[]`                       | Anciens ID qui se normalisent vers cet ID canonique de plugin.                                                                                                                                                                      |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | ID de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou les références de modèle les mentionnent.                                                                           |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                   |
| `channels`                           | Non         | `string[]`                       | ID de canaux détenus par ce plugin. Utilisé pour la découverte et la validation de configuration.                                                                                                                                    |
| `providers`                          | Non         | `string[]`                       | ID de fournisseurs détenus par ce plugin.                                                                                                                                                                                           |
| `providerCatalogEntry`               | Non         | `string`                         | Chemin de module léger du catalogue de fournisseurs, relatif à la racine du plugin, pour les métadonnées de catalogue de fournisseurs limitées au manifeste qui peuvent être chargées sans activer tout l’environnement d’exécution du plugin. |
| `modelSupport`                       | Non         | `object`                         | Raccourci, détenu par le manifeste, pour les métadonnées de famille de modèles utilisées afin de charger automatiquement le plugin avant l’exécution.                                                                                |
| `modelCatalog`                       | Non         | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs détenus par ce plugin. C’est le contrat du plan de contrôle pour les futurs listages en lecture seule, l’intégration, les sélecteurs de modèles, les alias et la suppression sans charger l’environnement d’exécution du plugin. |
| `modelPricing`                       | Non         | `object`                         | Politique de recherche de tarification externe détenue par le fournisseur. Utilisez-la pour exclure les fournisseurs locaux/auto-hébergés des catalogues de tarification distants ou mapper les références de fournisseur vers les ID de catalogue OpenRouter/LiteLLM sans coder en dur les ID de fournisseurs dans le cœur. |
| `modelIdNormalization`               | Non         | `object`                         | Nettoyage des alias/préfixes d’ID de modèle, détenu par le fournisseur, qui doit s’exécuter avant le chargement de l’environnement d’exécution du fournisseur.                                                                      |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées, détenues par le manifeste, d’hôte de point de terminaison/baseUrl pour les routes de fournisseur que le cœur doit classer avant le chargement de l’environnement d’exécution du fournisseur.                            |
| `providerRequest`                    | Non         | `object`                         | Métadonnées légères de famille de fournisseur et de compatibilité des requêtes utilisées par la politique de requête générique avant le chargement de l’environnement d’exécution du fournisseur.                                   |
| `cliBackends`                        | Non         | `string[]`                       | ID de moteurs d’inférence CLI détenus par ce plugin. Utilisés pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                                               |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de moteur CLI dont le hook d’authentification synthétique détenu par le plugin doit être sondé pendant la découverte à froid des modèles avant le chargement de l’environnement d’exécution.            |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs d’espace réservé de clé API détenues par le plugin groupé, représentant un état d’identifiants non secret local, OAuth ou ambiant.                                                                                           |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes détenus par ce plugin qui doivent produire des diagnostics de configuration et de CLI conscients du plugin avant le chargement de l’environnement d’exécution.                                                     |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées d’environnement de compatibilité obsolètes pour la recherche d’authentification/statut de fournisseur. Préférez `setup.providers[].envVars` pour les nouveaux plugins ; OpenClaw les lit encore pendant la fenêtre de dépréciation. |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | ID de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de codage qui partage la clé API et les profils d’authentification du fournisseur de base.      |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées d’environnement légères de canal qu’OpenClaw peut inspecter sans charger le code du plugin. Utilisez-les pour la configuration de canal pilotée par l’environnement ou les surfaces d’authentification que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’intégration, la résolution du fournisseur préféré et le câblage simple des indicateurs CLI.                                                                    |
| `activation`                         | Non         | `object`                         | Métadonnées légères du planificateur d’activation pour le démarrage, les fournisseurs, les commandes, les canaux, les routes et le chargement déclenché par les capacités. Métadonnées uniquement ; l’environnement d’exécution du plugin reste propriétaire du comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/intégration que les surfaces de découverte et de configuration peuvent inspecter sans charger l’environnement d’exécution du plugin.                                                           |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement de l’environnement d’exécution du plugin.                                                                                         |
| `contracts`                          | Non         | `object`                         | Instantané statique de propriété des capacités pour les hooks d’authentification externes, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, la récupération Web, la recherche Web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les ID de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                            |
| `imageGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération d’images pour les ID de fournisseurs déclarés dans `contracts.imageGenerationProviders`, y compris les alias d’authentification détenus par le fournisseur et les protections d’URL de base. |
| `videoGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération vidéo pour les ID de fournisseurs déclarés dans `contracts.videoGenerationProviders`, y compris les alias d’authentification détenus par le fournisseur et les protections d’URL de base. |
| `musicGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération musicale pour les ID de fournisseurs déclarés dans `contracts.musicGenerationProviders`, y compris les alias d’authentification détenus par le fournisseur et les protections d’URL de base. |
| `toolMetadata`                       | Non         | `Record<string, object>`         | Métadonnées légères de disponibilité pour les outils détenus par le plugin déclarés dans `contracts.tools`. Utilisez-les lorsqu’un outil ne doit pas charger l’environnement d’exécution sauf si des preuves de configuration, d’environnement ou d’authentification existent. |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement de l’environnement d’exécution.                                                     |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                                                    |
| `name`                               | Non      | `string`                         | Nom de Plugin lisible par l’humain.                                                                                                                                                                                                 |
| `description`                        | Non      | `string`                         | Bref résumé affiché dans les surfaces du Plugin.                                                                                                                                                                                    |
| `version`                            | Non      | `string`                         | Version informative du Plugin.                                                                                                                                                                                                      |
| `uiHints`                            | Non      | `Record<string, object>`         | Libellés d’interface utilisateur, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                                                  |

## Référence des métadonnées des fournisseurs de génération

Les champs de métadonnées des fournisseurs de génération décrivent les signaux d’authentification statiques pour les
fournisseurs déclarés dans la liste `contracts.*GenerationProviders` correspondante.
OpenClaw lit ces champs avant le chargement du runtime fournisseur afin que les outils du noyau puissent
déterminer si un fournisseur de génération est disponible sans importer chaque
plugin fournisseur.

Utilisez ces champs uniquement pour des faits déclaratifs peu coûteux. Le transport, les transformations de requête,
l’actualisation des jetons, la validation des identifiants et le comportement de génération réel
restent dans le runtime du plugin.

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

Chaque entrée de métadonnées prend en charge :

| Champ           | Obligatoire | Type       | Signification                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Non       | `string[]` | Identifiants de fournisseur supplémentaires qui doivent être comptés comme alias d’authentification statiques pour le fournisseur de génération. |
| `authProviders` | Non       | `string[]` | Identifiants de fournisseur dont les profils d’authentification configurés doivent compter comme authentification pour ce fournisseur de génération. |
| `configSignals` | Non       | `object[]` | Signaux de disponibilité peu coûteux basés uniquement sur la configuration pour les fournisseurs locaux ou auto-hébergés pouvant être configurés sans profils d’authentification ni variables d’environnement. |
| `authSignals`   | Non       | `object[]` | Signaux d’authentification explicites. Lorsqu’ils sont présents, ils remplacent l’ensemble de signaux par défaut issu de l’identifiant du fournisseur, de `aliases` et de `authProviders`. |

Chaque entrée `configSignals` prend en charge :

| Champ         | Obligatoire | Type       | Signification                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Oui      | `string`   | Chemin à points vers l’objet de configuration appartenant au plugin à inspecter, par exemple `plugins.entries.example.config`. |
| `overlayPath` | Non       | `string`   | Chemin à points à l’intérieur de la configuration racine dont l’objet doit se superposer à l’objet racine avant l’évaluation du signal. Utilisez-le pour la configuration propre à une capacité, comme `image`, `video` ou `music`. |
| `required`    | Non       | `string[]` | Chemins à points à l’intérieur de la configuration effective qui doivent avoir des valeurs configurées. Les chaînes doivent être non vides ; les objets et tableaux ne doivent pas être vides. |
| `requiredAny` | Non       | `string[]` | Chemins à points à l’intérieur de la configuration effective dont au moins un doit avoir une valeur configurée. |
| `mode`        | Non       | `object`   | Garde de mode chaîne facultative à l’intérieur de la configuration effective. Utilisez-la lorsque la disponibilité basée uniquement sur la configuration ne s’applique qu’à un seul mode. |

Chaque garde `mode` prend en charge :

| Champ        | Obligatoire | Type       | Signification                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Non       | `string`   | Chemin à points à l’intérieur de la configuration effective. Par défaut : `mode`. |
| `default`    | Non       | `string`   | Valeur de mode à utiliser lorsque la configuration omet le chemin. |
| `allowed`    | Non       | `string[]` | S’il est présent, le signal passe uniquement lorsque le mode effectif est l’une de ces valeurs. |
| `disallowed` | Non       | `string[]` | S’il est présent, le signal échoue lorsque le mode effectif est l’une de ces valeurs. |

Chaque entrée `authSignals` prend en charge :

| Champ             | Obligatoire | Type     | Signification                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui      | `string` | Identifiant de fournisseur à vérifier dans les profils d’authentification configurés. |
| `providerBaseUrl` | Non       | `object` | Garde facultative qui fait compter le signal uniquement lorsque le fournisseur configuré référencé utilise une URL de base autorisée. Utilisez-la lorsqu’un alias d’authentification n’est valide que pour certaines API. |

Chaque garde `providerBaseUrl` prend en charge :

| Champ             | Obligatoire | Type       | Signification                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui      | `string`   | Identifiant de configuration du fournisseur dont `baseUrl` doit être vérifié. |
| `defaultBaseUrl`  | Non       | `string`   | URL de base à supposer lorsque la configuration du fournisseur omet `baseUrl`. |
| `allowedBaseUrls` | Oui      | `string[]` | URL de base autorisées pour ce signal d’authentification. Le signal est ignoré lorsque l’URL de base configurée ou par défaut ne correspond à aucune de ces valeurs normalisées. |

## Référence des métadonnées d’outils

`toolMetadata` utilise les mêmes formes `configSignals` et `authSignals` que les
métadonnées des fournisseurs de génération, indexées par nom d’outil. `contracts.tools` déclare
la propriété. `toolMetadata` déclare des preuves de disponibilité peu coûteuses afin qu’OpenClaw puisse
éviter d’importer un runtime de plugin simplement pour que sa fabrique d’outils renvoie `null`.

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

Si un outil n’a pas de `toolMetadata`, OpenClaw conserve le comportement existant et
charge le plugin propriétaire lorsque le contrat de l’outil correspond à la politique. Pour les outils
sur le chemin critique dont la fabrique dépend de l’authentification ou de la configuration, les auteurs de plugins doivent déclarer
`toolMetadata` au lieu de faire importer le runtime par le noyau pour demander.

## Référence providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’intégration ou d’authentification.
OpenClaw la lit avant le chargement du runtime fournisseur.
Les listes de configuration de fournisseur utilisent ces choix de manifeste, les choix de configuration dérivés du descripteur
et les métadonnées du catalogue d’installation sans charger le runtime fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui      | `string`                                        | Identifiant du fournisseur auquel ce choix appartient. |
| `method`              | Oui      | `string`                                        | Identifiant de méthode d’authentification vers lequel router. |
| `choiceId`            | Oui      | `string`                                        | Identifiant stable du choix d’authentification utilisé par les flux d’intégration et de CLI. |
| `choiceLabel`         | Non       | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw se rabat sur `choiceId`. |
| `choiceHint`          | Non       | `string`                                        | Court texte d’aide pour le sélecteur. |
| `assistantPriority`   | Non       | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant. |
| `assistantVisibility` | Non       | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l’assistant tout en autorisant toujours la sélection manuelle par CLI. |
| `deprecatedChoiceIds` | Non       | `string[]`                                      | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement. |
| `groupId`             | Non       | `string`                                        | Identifiant de groupe facultatif pour regrouper des choix liés. |
| `groupLabel`          | Non       | `string`                                        | Libellé visible par l’utilisateur pour ce groupe. |
| `groupHint`           | Non       | `string`                                        | Court texte d’aide pour le groupe. |
| `optionKey`           | Non       | `string`                                        | Clé d’option interne pour les flux d’authentification simples à indicateur unique. |
| `cliFlag`             | Non       | `string`                                        | Nom de l’indicateur CLI, comme `--openrouter-api-key`. |
| `cliOption`           | Non       | `string`                                        | Forme complète de l’option CLI, comme `--openrouter-api-key <key>`. |
| `cliDescription`      | Non       | `string`                                        | Description utilisée dans l’aide de la CLI. |
| `onboardingScopes`    | Non       | `Array<"text-inference" \| "image-generation">` | Surfaces d’intégration dans lesquelles ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence commandAliases

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande d’exécution que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou tenter d’exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code d’exécution du plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Champ        | Obligatoire | Type              | Signification                                                           |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce plugin.                               |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme une commande slash de chat plutôt qu’une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, s’il en existe une.  |

## référence d’activation

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/de chargement.

Ce bloc est une métadonnée de planification, pas une API de cycle de vie. Il n’enregistre pas
de comportement d’exécution, ne remplace pas `register(...)` et ne promet pas que
le code du plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
restreindre les plugins candidats avant de se rabattre sur les métadonnées de propriété existantes
du manifeste, telles que `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez les métadonnées les plus étroites qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour des indications de
planification supplémentaires qui ne peuvent pas être représentées par ces champs de propriété.
Utilisez `cliBackends` au niveau supérieur pour les alias d’exécution CLI tels que `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` sert uniquement aux
ids de harnais d’agent intégrés qui ne disposent pas déjà d’un champ de propriété.

Ce bloc est uniquement une métadonnée. Il n’enregistre pas de comportement d’exécution et ne
remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée d’exécution/de plugin.
Les consommateurs actuels l’utilisent comme indication de restriction avant un chargement plus large des plugins, donc
l’absence de métadonnées d’activation hors démarrage ne coûte généralement que des performances; elle
ne devrait pas modifier la correction tant que les replis de propriété du manifeste existent encore.

Chaque plugin doit définir `activation.onStartup` intentionnellement. Définissez-le sur `true`
uniquement lorsque le plugin doit s’exécuter pendant le démarrage du Gateway. Définissez-le sur `false` lorsque
le plugin est inerte au démarrage et ne doit se charger qu’à partir de déclencheurs plus étroits.
Omettre `onStartup` ne charge plus implicitement le plugin au démarrage; utilisez des
métadonnées d’activation explicites pour le démarrage, le canal, la configuration, le harnais d’agent, la mémoire ou
d’autres déclencheurs d’activation plus étroits.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Champ              | Obligatoire | Type                                                 | Signification                                                                                                                                                                               |
| ------------------ | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Non         | `boolean`                                            | Activation explicite au démarrage du Gateway. Chaque plugin doit la définir. `true` importe le plugin pendant le démarrage; `false` le garde paresseux au démarrage sauf si un autre déclencheur correspondant exige son chargement. |
| `onProviders`      | Non         | `string[]`                                           | Ids de fournisseurs qui doivent inclure ce plugin dans les plans d’activation/de chargement.                                                                                                                      |
| `onAgentHarnesses` | Non         | `string[]`                                           | Ids d’exécution de harnais d’agent intégrés qui doivent inclure ce plugin dans les plans d’activation/de chargement. Utilisez `cliBackends` au niveau supérieur pour les alias de backend CLI.                                           |
| `onCommands`       | Non         | `string[]`                                           | Ids de commandes qui doivent inclure ce plugin dans les plans d’activation/de chargement.                                                                                                                       |
| `onChannels`       | Non         | `string[]`                                           | Ids de canaux qui doivent inclure ce plugin dans les plans d’activation/de chargement.                                                                                                                       |
| `onRoutes`         | Non         | `string[]`                                           | Types de routes qui doivent inclure ce plugin dans les plans d’activation/de chargement.                                                                                                                       |
| `onConfigPaths`    | Non         | `string[]`                                           | Chemins de configuration relatifs à la racine qui doivent inclure ce plugin dans les plans de démarrage/de chargement lorsque le chemin est présent et pas explicitement désactivé.                                                      |
| `onCapabilities`   | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications de capacité larges utilisées par la planification d’activation du plan de contrôle. Préférez des champs plus étroits lorsque c’est possible.                                                                                     |

Consommateurs actifs actuels :

- La planification du démarrage du Gateway utilise `activation.onStartup` pour l’importation
  explicite au démarrage
- la planification CLI déclenchée par une commande se rabat sur les anciens
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification du démarrage de l’exécution d’agent utilise `activation.onAgentHarnesses` pour les
  harnais intégrés et `cliBackends[]` au niveau supérieur pour les alias d’exécution CLI
- la planification de configuration/de canal déclenchée par le canal se rabat sur l’ancienne propriété `channels[]`
  lorsque les métadonnées d’activation de canal explicites sont absentes
- la planification des plugins au démarrage utilise `activation.onConfigPaths` pour les surfaces de configuration racine
  hors canal, comme le bloc `browser` du plugin de navigateur groupé
- la planification de configuration/d’exécution déclenchée par le fournisseur se rabat sur l’ancienne propriété
  `providers[]` et `cliBackends[]` au niveau supérieur lorsque les métadonnées d’activation de fournisseur explicites
  sont absentes

Les diagnostics du planificateur peuvent distinguer les indications d’activation explicites du repli de
propriété du manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` a correspondu, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces libellés de raison sont destinés aux
diagnostics de l’hôte et aux tests; les auteurs de plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## référence de qaRunners

Utilisez `qaRunners` lorsqu’un plugin fournit un ou plusieurs exécuteurs de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées peu coûteuses et statiques; l’exécution du plugin
reste propriétaire de l’enregistrement CLI réel via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                      |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.    |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

## référence de setup

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées peu coûteuses
appartenant au plugin avant le chargement de l’exécution.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` au niveau supérieur reste valide et continue à décrire les backends d’inférence CLI.
`setup.cliBackends` est la surface de descripteur propre à la configuration pour les
flux de plan de contrôle/configuration qui doivent rester uniquement des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
à descripteur prioritaire privilégiée pour la découverte de configuration. Si le descripteur ne fait que
restreindre le plugin candidat et que la configuration a encore besoin de hooks d’exécution de configuration
plus riches, définissez `requiresRuntime: true` et conservez `setup-api` comme
chemin d’exécution de repli.

OpenClaw inclut aussi `setup.providers[].envVars` dans les recherches génériques d’authentification fournisseur et
de variables d’environnement. `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
pendant la fenêtre de dépréciation, mais les plugins non groupés qui l’utilisent encore
reçoivent un diagnostic de manifeste. Les nouveaux plugins doivent placer les métadonnées d’environnement de configuration/statut
sur `setup.providers[].envVars`.

OpenClaw peut aussi dériver des choix de configuration simples depuis `setup.providers[].authMethods`
lorsqu’aucune entrée de configuration n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que l’exécution de configuration est inutile. Les entrées explicites `providerAuthChoices` restent
préférées pour les libellés personnalisés, les indicateurs CLI, la portée d’onboarding et les métadonnées d’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs sont suffisants pour la
surface de configuration. OpenClaw traite `false` explicite comme un contrat uniquement descripteur
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche de configuration. Si
un plugin uniquement descripteur fournit quand même l’une de ces entrées d’exécution de configuration,
OpenClaw signale un diagnostic additif et continue à l’ignorer. Omettre
`requiresRuntime` conserve le comportement de repli hérité afin que les plugins existants qui ont ajouté
des descripteurs sans l’indicateur ne cassent pas.

Comme la recherche de configuration peut exécuter du code `setup-api` appartenant au plugin, les valeurs normalisées
`setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les
plugins découverts. Une propriété ambiguë échoue fermée au lieu de choisir un
gagnant selon l’ordre de découverte.

Lorsque l’exécution de configuration s’exécute effectivement, les diagnostics du registre de configuration signalent une dérive de descripteur
si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs du manifeste
ne déclarent pas, ou si un descripteur n’a pas d’enregistrement d’exécution
correspondant. Ces diagnostics sont additifs et ne rejettent pas les plugins hérités.

### référence de setup.providers

| Champ          | Obligatoire | Type       | Signification                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Oui         | `string`   | Id de fournisseur exposé pendant la configuration ou l’onboarding. Gardez les ids normalisés globalement uniques.             |
| `authMethods`  | Non         | `string[]` | Ids de méthodes de configuration/d’authentification que ce fournisseur prend en charge sans charger l’exécution complète.                       |
| `envVars`      | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement de l’exécution du plugin.               |
| `authEvidence` | Non         | `object[]` | Vérifications peu coûteuses de preuve d’authentification locale pour les fournisseurs qui peuvent s’authentifier au moyen de marqueurs non secrets. |

`authEvidence` est destiné aux marqueurs d’identifiants locaux appartenant au fournisseur qui peuvent être
vérifiés sans charger de code d’exécution. Ces vérifications doivent rester peu coûteuses et locales :
aucun appel réseau, aucune lecture du trousseau ou d’un gestionnaire de secrets, aucune commande shell et aucun
test d’API fournisseur.

Entrées de preuve prises en charge :

| Champ              | Obligatoire | Type       | Signification                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Oui      | `string`   | Actuellement `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Non       | `string`   | Variable d’environnement contenant un chemin explicite vers le fichier d’identifiants.                                                           |
| `fallbackPaths`    | Non       | `string[]` | Chemins locaux de fichiers d’identifiants vérifiés lorsque `fileEnvVar` est absent ou vide. Prend en charge `${HOME}` et `${APPDATA}`. |
| `requiresAnyEnv`   | Non       | `string[]` | Au moins une variable d’environnement listée doit être non vide pour que la preuve soit valide.                                    |
| `requiresAllEnv`   | Non       | `string[]` | Chaque variable d’environnement listée doit être non vide pour que la preuve soit valide.                                           |
| `credentialMarker` | Oui      | `string`   | Marqueur non secret renvoyé lorsque la preuve est présente.                                                       |
| `source`           | Non       | `string`   | Libellé de source visible par l’utilisateur pour la sortie d’authentification/de statut.                                                               |

### Champs setup

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non       | `object[]` | Descripteurs de configuration du fournisseur exposés pendant la configuration et l’onboarding.                                     |
| `cliBackends`      | Non       | `string[]` | Identifiants de backends utilisés au moment de la configuration pour la recherche de configuration privilégiant les descripteurs. Gardez les identifiants normalisés uniques globalement. |
| `configMigrations` | Non       | `string[]` | Identifiants de migration de configuration appartenant à la surface de configuration de ce Plugin.                                          |
| `requiresRuntime`  | Non       | `boolean`  | Indique si la configuration nécessite encore l’exécution de `setup-api` après la recherche de descripteur.                            |

## Référence uiHints

`uiHints` est une table de correspondance entre les noms de champs de configuration et de petits indices de rendu.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Chaque indice de champ peut inclure :

| Champ         | Type       | Signification                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé du champ visible par l’utilisateur.                |
| `help`        | `string`   | Texte d’aide court.                      |
| `tags`        | `string[]` | Étiquettes d’interface facultatives.                       |
| `advanced`    | `boolean`  | Marque le champ comme avancé.            |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les entrées de formulaire.       |

## Référence contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacité qu’OpenClaw peut
lire sans importer le runtime du Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identifiants de fabriques d’extensions de serveur d’application Codex, actuellement `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identifiants de runtime pour lesquels un Plugin intégré peut enregistrer un middleware de résultat d’outil. |
| `externalAuthProviders`          | `string[]` | Identifiants de fournisseurs dont ce Plugin possède le hook de profil d’authentification externe.       |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de synthèse vocale appartenant à ce Plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription en temps réel appartenant à ce Plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de voix en temps réel appartenant à ce Plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants de fournisseurs d’embeddings mémoire appartenant à ce Plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension des médias appartenant à ce Plugin.                    |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d’images appartenant à ce Plugin.                       |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération de vidéos appartenant à ce Plugin.                       |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération web appartenant à ce Plugin.                              |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche web appartenant à ce Plugin.                             |
| `migrationProviders`             | `string[]` | Identifiants de fournisseurs d’import appartenant à ce Plugin pour `openclaw migrate`.          |
| `tools`                          | `string[]` | Noms d’outils d’agent appartenant à ce Plugin.                                    |

`contracts.embeddedExtensionFactories` est conservé pour les fabriques d’extensions
réservées au serveur d’application Codex intégré. Les transformations intégrées de résultats d’outil doivent
déclarer `contracts.agentToolResultMiddleware` et s’enregistrer avec
`api.registerAgentToolResultMiddleware(...)` à la place. Les Plugins externes ne peuvent pas
enregistrer de middleware de résultat d’outil, car la jonction peut réécrire la sortie d’outils à haute confiance
avant que le modèle ne la voie.

Les enregistrements Runtime `api.registerTool(...)` doivent correspondre à `contracts.tools`.
La découverte d’outils utilise cette liste pour ne charger que les runtimes de Plugins qui peuvent posséder les
outils demandés.

Les Plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les Plugins sans cette déclaration passent encore
par un fallback de compatibilité obsolète, mais ce fallback est plus lent et
sera supprimé après la fenêtre de migration.

Les fournisseurs intégrés d’embeddings mémoire doivent déclarer
`contracts.memoryEmbeddingProviders` pour chaque identifiant d’adaptateur qu’ils exposent, y compris
les adaptateurs intégrés tels que `local`. Les chemins CLI autonomes utilisent ce contrat de manifeste
pour charger uniquement le Plugin propriétaire avant que le runtime Gateway complet ait
enregistré les fournisseurs.

## Référence mediaUnderstandingProviderMetadata

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias a
des modèles par défaut, une priorité de fallback d’authentification automatique ou une prise en charge native des documents dont
les helpers génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Chaque entrée de fournisseur peut inclure :

| Champ                  | Type                                | Signification                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                                 |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne spécifie pas de modèle.      |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus bas sont triés plus tôt pour le fallback automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de documents natives prises en charge par le fournisseur.                            |

## Référence channelConfigs

Utilisez `channelConfigs` lorsqu’un Plugin de canal a besoin de métadonnées de configuration peu coûteuses avant
le chargement du runtime. La découverte en lecture seule de la configuration/du statut du canal peut utiliser ces métadonnées
directement pour les canaux externes configurés lorsqu’aucune entrée de configuration n’est disponible, ou
lorsque `setup.requiresRuntime: false` déclare que le runtime de configuration est inutile.

`channelConfigs` est une métadonnée de manifeste de Plugin, et non une nouvelle section de configuration utilisateur
de premier niveau. Les utilisateurs configurent toujours les instances de canal sous `channels.<channel-id>`.
OpenClaw lit les métadonnées du manifeste pour décider quel Plugin possède ce canal configuré
avant l’exécution du code de runtime du Plugin.

Pour un Plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les Plugins non intégrés qui déclarent `channels[]` doivent aussi déclarer les entrées
`channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le Plugin, mais
les surfaces de schéma de configuration, de configuration initiale et d’interface Control sur les chemins froids ne peuvent pas connaître la
forme des options appartenant au canal avant l’exécution du runtime du Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et
`nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut statiques `auto` pour les vérifications de configuration de commandes
qui s’exécutent avant le chargement du runtime du canal. Les canaux intégrés peuvent aussi publier
les mêmes valeurs par défaut via `package.json#openclaw.channel.commands` en plus
de leurs autres métadonnées de catalogue de canal appartenant au paquet.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Chaque entrée de canal peut inclure :

| Champ         | Type                     | Signification                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Requis pour chaque entrée déclarée de configuration de canal.         |
| `uiHints`     | `Record<string, object>` | Libellés, espaces réservés et indications sensibles facultatifs pour cette section de configuration de canal.          |
| `label`       | `string`                 | Libellé de canal fusionné dans le sélecteur et les surfaces d’inspection lorsque les métadonnées d’exécution ne sont pas prêtes. |
| `description` | `string`                 | Brève description du canal pour les surfaces d’inspection et de catalogue.                               |
| `commands`    | `object`                 | Commande native statique et valeurs par défaut automatiques des Skills natives pour les vérifications de configuration avant l’exécution.       |
| `preferOver`  | `string[]`               | Identifiants de Plugins hérités ou de priorité inférieure que ce canal doit devancer dans les surfaces de sélection.    |

### Remplacer un autre Plugin de canal

Utilisez `preferOver` lorsque votre Plugin est le propriétaire préféré pour un identifiant de canal qu’un
autre Plugin peut également fournir. Les cas courants sont un identifiant de Plugin renommé, un
Plugin autonome qui remplace un Plugin groupé, ou un fork maintenu qui
conserve le même identifiant de canal pour la compatibilité de configuration.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Lorsque `channels.chat` est configuré, OpenClaw prend en compte à la fois l’identifiant de canal et
l’identifiant de Plugin préféré. Si le Plugin de priorité inférieure n’a été sélectionné que parce
qu’il est groupé ou activé par défaut, OpenClaw le désactive dans la configuration
d’exécution effective afin qu’un seul Plugin possède le canal et ses outils. La sélection explicite de l’utilisateur
reste prioritaire : si l’utilisateur active explicitement les deux Plugins, OpenClaw
préserve ce choix et signale des diagnostics de canaux/outils en double au lieu de
modifier silencieusement l’ensemble de Plugins demandé.

Gardez `preferOver` limité aux identifiants de Plugins qui peuvent réellement fournir le même canal.
Ce n’est pas un champ de priorité général et il ne renomme pas les clés de configuration utilisateur.

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre Plugin fournisseur à partir
d’identifiants de modèles abrégés comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement
de l’exécution du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette précédence :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` propriétaires
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un Plugin non groupé et un Plugin groupé correspondent tous deux, le Plugin non groupé
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants de modèles abrégés.                 |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants de modèles abrégés après suppression du suffixe de profil. |

## Référence `modelCatalog`

Utilisez `modelCatalog` lorsqu’OpenClaw doit connaître les métadonnées des modèles du fournisseur avant
le chargement de l’exécution du Plugin. Il s’agit de la source détenue par le manifeste pour les lignes de catalogue
fixes, les alias de fournisseur, les règles de suppression et le mode de découverte. L’actualisation à l’exécution
reste du ressort du code d’exécution du fournisseur, mais le manifeste indique au cœur quand l’exécution
est requise.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Champs de premier niveau :

| Champ          | Type                                                     | Signification                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Lignes de catalogue pour les identifiants de fournisseurs possédés par ce Plugin. Les clés doivent aussi apparaître dans `providers` de premier niveau.       |
| `aliases`      | `Record<string, object>`                                 | Alias de fournisseurs qui doivent se résoudre en un fournisseur possédé pour la planification du catalogue ou des suppressions.              |
| `suppressions` | `object[]`                                               | Lignes de modèles provenant d’une autre source que ce Plugin supprime pour une raison propre au fournisseur.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées du manifeste, actualisé dans le cache, ou nécessite l’exécution. |

`aliases` participe à la recherche de propriété du fournisseur pour la planification du catalogue de modèles.
Les cibles d’alias doivent être des fournisseurs de premier niveau possédés par le même Plugin. Lorsqu’une
liste filtrée par fournisseur utilise un alias, OpenClaw peut lire le manifeste propriétaire et
appliquer les remplacements d’API/d’URL de base de l’alias sans charger l’exécution du fournisseur.
Les alias n’étendent pas les listings de catalogue non filtrés ; les listes larges émettent uniquement
les lignes du fournisseur canonique propriétaire.

`suppressions` remplace l’ancien hook d’exécution du fournisseur `suppressBuiltInModel`.
Les entrées de suppression ne sont honorées que lorsque le fournisseur est possédé par le Plugin ou
déclaré comme une clé `modelCatalog.aliases` qui cible un fournisseur possédé. Les hooks de suppression
à l’exécution ne sont plus appelés pendant la résolution de modèle.

Champs du fournisseur :

| Champ     | Type                     | Signification                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL de base par défaut facultative pour les modèles de ce catalogue de fournisseur.    |
| `api`     | `ModelApi`               | Adaptateur d’API par défaut facultatif pour les modèles de ce catalogue de fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques facultatifs qui s’appliquent à ce catalogue de fournisseur.      |
| `models`  | `object[]`               | Lignes de modèles requises. Les lignes sans `id` sont ignorées.            |

Champs du modèle :

| Champ           | Type                                                           | Signification                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Identifiant de modèle local au fournisseur, sans le préfixe `provider/`.                    |
| `name`          | `string`                                                       | Nom d’affichage facultatif.                                                      |
| `api`           | `ModelApi`                                                     | Remplacement d’API facultatif par modèle.                                            |
| `baseUrl`       | `string`                                                       | Remplacement facultatif de l’URL de base par modèle.                                       |
| `headers`       | `Record<string, string>`                                       | En-têtes statiques facultatifs par modèle.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalités acceptées par le modèle.                                               |
| `reasoning`     | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.                               |
| `contextWindow` | `number`                                                       | Fenêtre de contexte native du fournisseur.                                             |
| `contextTokens` | `number`                                                       | Plafond de contexte effectif facultatif à l’exécution lorsqu’il diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de jetons de sortie lorsqu’il est connu.                                           |
| `cost`          | `object`                                                       | Tarification facultative en USD par million de jetons, incluant éventuellement `tieredPricing`. |
| `compat`        | `object`                                                       | Indicateurs de compatibilité facultatifs correspondant à la compatibilité de configuration des modèles OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | État du listing. Supprimez uniquement lorsque la ligne ne doit pas apparaître du tout.          |
| `statusReason`  | `string`                                                       | Motif facultatif affiché avec un état non disponible.                            |
| `replaces`      | `string[]`                                                     | Anciens identifiants de modèles locaux au fournisseur que ce modèle remplace.                       |
| `replacedBy`    | `string`                                                       | Identifiant de modèle local au fournisseur de remplacement pour les lignes obsolètes.                    |
| `tags`          | `string[]`                                                     | Étiquettes stables utilisées par les sélecteurs et les filtres.                                    |

Champs de suppression :

| Champ                      | Type       | Signification                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identifiant de fournisseur pour la ligne amont à supprimer. Doit être possédé par ce Plugin ou déclaré comme alias possédé. |
| `model`                    | `string`   | Identifiant de modèle local au fournisseur à supprimer.                                                                      |
| `reason`                   | `string`   | Message facultatif affiché lorsque la ligne supprimée est demandée directement.                                     |
| `when.baseUrlHosts`        | `string[]` | Liste facultative des hôtes d’URL de base effectifs du fournisseur requis avant que la suppression s’applique.               |
| `when.providerConfigApiIn` | `string[]` | Liste facultative des valeurs exactes `api` de configuration du fournisseur requises avant que la suppression s’applique.              |

Ne placez pas de données propres au runtime dans `modelCatalog`. Utilisez `static` uniquement lorsque les lignes du manifeste sont suffisamment complètes pour que les surfaces de liste filtrée par fournisseur et de sélecteur puissent ignorer la découverte du registre/runtime. Utilisez `refreshable` lorsque les lignes du manifeste sont des graines ou des compléments listables utiles, mais qu’un rafraîchissement/cache peut ajouter davantage de lignes ultérieurement ; les lignes refreshable ne font pas autorité à elles seules. Utilisez `runtime` lorsque OpenClaw doit charger le runtime du fournisseur pour connaître la liste.

## Référence modelIdNormalization

Utilisez `modelIdNormalization` pour un nettoyage peu coûteux des identifiants de modèle appartenant au fournisseur, qui doit avoir lieu avant le chargement du runtime du fournisseur. Cela conserve les alias comme les noms de modèle courts, les anciens identifiants locaux au fournisseur et les règles de préfixe de proxy dans le manifeste du Plugin propriétaire, plutôt que dans les tables principales de sélection de modèle.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Champs du fournisseur :

| Champ                                | Type                    | Signification                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias exacts d’identifiant de modèle, insensibles à la casse. Les valeurs sont renvoyées telles qu’elles sont écrites.                  |
| `stripPrefixes`                      | `string[]`              | Préfixes à supprimer avant la recherche d’alias, utiles pour les duplications historiques fournisseur/modèle.     |
| `prefixWhenBare`                     | `string`                | Préfixe à ajouter lorsque l’identifiant de modèle normalisé ne contient pas déjà `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Règles conditionnelles de préfixe pour identifiants nus après recherche d’alias, indexées par `modelPrefix` et `prefix`. |

## Référence providerEndpoints

Utilisez `providerEndpoints` pour la classification des points de terminaison que la politique de requête générique doit connaître avant le chargement du runtime du fournisseur. Le cœur reste propriétaire de la signification de chaque `endpointClass` ; les manifestes de Plugin possèdent les métadonnées d’hôte et d’URL de base.

Champs de point de terminaison :

| Champ                          | Type       | Signification                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de point de terminaison connue du cœur, comme `openrouter`, `moonshot-native` ou `google-vertex`.        |
| `hosts`                        | `string[]` | Noms d’hôte exacts qui correspondent à la classe de point de terminaison.                                                |
| `hostSuffixes`                 | `string[]` | Suffixes d’hôte qui correspondent à la classe de point de terminaison. Préfixez avec `.` pour une correspondance limitée aux suffixes de domaine. |
| `baseUrls`                     | `string[]` | URL de base HTTP(S) normalisées exactes qui correspondent à la classe de point de terminaison.                             |
| `googleVertexRegion`           | `string`   | Région Google Vertex statique pour les hôtes globaux exacts.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffixe à retirer des hôtes correspondants pour exposer le préfixe de région Google Vertex.                 |

## Référence providerRequest

Utilisez `providerRequest` pour les métadonnées peu coûteuses de compatibilité des requêtes dont la politique de requête générique a besoin sans charger le runtime du fournisseur. Conservez la réécriture de payload propre au comportement dans les hooks de runtime du fournisseur ou dans des helpers partagés de famille de fournisseurs.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Champs du fournisseur :

| Champ                 | Type         | Signification                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | Libellé de famille de fournisseurs utilisé par les décisions génériques de compatibilité des requêtes et les diagnostics. |
| `compatibilityFamily` | `"moonshot"` | Compartiment facultatif de compatibilité de famille de fournisseurs pour les helpers de requêtes partagés.              |
| `openAICompletions`   | `object`     | Indicateurs de requête de complétion compatibles OpenAI, actuellement `supportsStreamingUsage`.       |

## Référence modelPricing

Utilisez `modelPricing` lorsqu’un fournisseur doit contrôler le comportement tarifaire du plan de contrôle avant le chargement du runtime. Le cache de tarification du Gateway lit ces métadonnées sans importer le code de runtime du fournisseur.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Champs du fournisseur :

| Champ        | Type              | Signification                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Définissez sur `false` pour les fournisseurs locaux/auto-hébergés qui ne doivent jamais récupérer la tarification OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mappage de recherche de tarification OpenRouter. `false` désactive la recherche OpenRouter pour ce fournisseur.           |
| `liteLLM`    | `false \| object` | Mappage de recherche de tarification LiteLLM. `false` désactive la recherche LiteLLM pour ce fournisseur.                 |

Champs de source :

| Champ                      | Type               | Signification                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identifiant de fournisseur du catalogue externe lorsqu’il diffère de l’identifiant de fournisseur OpenClaw, par exemple `z-ai` pour un fournisseur `zai`. |
| `passthroughProviderModel` | `boolean`          | Traite les identifiants de modèle contenant une barre oblique comme des références fournisseur/modèle imbriquées, utile pour les fournisseurs proxy comme OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes supplémentaires d’identifiant de modèle du catalogue externe. `version-dots` essaie des identifiants de version avec points comme `claude-opus-4.6`.            |

### Index des fournisseurs OpenClaw

L’Index des fournisseurs OpenClaw est une métadonnée de prévisualisation appartenant à OpenClaw pour les fournisseurs dont les Plugins peuvent ne pas encore être installés. Il ne fait pas partie d’un manifeste de Plugin. Les manifestes de Plugin restent l’autorité des Plugins installés. L’Index des fournisseurs est le contrat de secours interne que les futures surfaces de fournisseurs installables et de sélecteur de modèles avant installation consommeront lorsqu’un Plugin de fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. `modelCatalog` du manifeste de Plugin installé.
3. Cache de catalogue de modèles provenant d’un rafraîchissement explicite.
4. Lignes de prévisualisation de l’Index des fournisseurs OpenClaw.

L’Index des fournisseurs ne doit contenir ni secrets, ni état activé, ni hooks de runtime, ni données de modèles propres à un compte en direct. Ses catalogues de prévisualisation utilisent la même forme de ligne de fournisseur `modelCatalog` que les manifestes de Plugin, mais doivent rester limités aux métadonnées d’affichage stables, sauf si des champs d’adaptateur runtime comme `api`, `baseUrl`, la tarification ou les indicateurs de compatibilité sont intentionnellement maintenus alignés avec le manifeste de Plugin installé. Les fournisseurs dotés d’une découverte `/models` en direct doivent écrire les lignes rafraîchies via le chemin explicite du cache de catalogue de modèles, au lieu de faire appeler les API fournisseur par la liste normale ou l’onboarding.

Les entrées de l’Index des fournisseurs peuvent également transporter des métadonnées de Plugin installable pour les fournisseurs dont le Plugin a été déplacé hors du cœur ou n’est pas encore installé pour une autre raison. Ces métadonnées reprennent le modèle du catalogue de canaux : nom du package, spécification d’installation npm, intégrité attendue et libellés peu coûteux de choix d’authentification suffisent à afficher une option de configuration installable. Une fois le Plugin installé, son manifeste l’emporte et l’entrée de l’Index des fournisseurs est ignorée pour ce fournisseur.

Les anciennes clés de capacité de premier niveau sont obsolètes. Utilisez `openclaw doctor --fix` pour déplacer `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal des manifestes ne traite plus ces champs de premier niveau comme une propriété de capacité.

## Manifeste versus package.json

Les deux fichiers remplissent des rôles différents :

| Fichier                   | À utiliser pour                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indices d’UI qui doivent exister avant l’exécution du code du Plugin                         |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le filtrage d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer un élément de métadonnées, appliquez cette règle :

- si OpenClaw doit le connaître avant de charger le code du Plugin, placez-le dans `openclaw.plugin.json`
- s’il concerne le packaging, les fichiers d’entrée ou le comportement d’installation npm, placez-le dans `package.json`

### Champs package.json qui affectent la découverte

Certaines métadonnées de Plugin avant runtime vivent intentionnellement dans `package.json` sous le bloc `openclaw` plutôt que dans `openclaw.plugin.json`.
`openclaw.bundle` et `openclaw.bundle.json` ne sont pas des contrats de Plugin OpenClaw ; les Plugins natifs doivent utiliser `openclaw.plugin.json` plus les champs `package.json#openclaw` pris en charge ci-dessous.

Exemples importants :

| Champ                                                                                      | Signification                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Déclare les points d’entrée natifs du Plugin. Doit rester dans le répertoire du package du Plugin.                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Déclare les points d’entrée runtime JavaScript générés pour les packages installés. Doit rester dans le répertoire du package du Plugin.                                             |
| `openclaw.setupEntry`                                                                      | Point d’entrée léger réservé à la configuration, utilisé pendant l’onboarding, le démarrage différé des canaux et la découverte en lecture seule de l’état du canal/des SecretRef. Doit rester dans le répertoire du package du Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Déclare le point d’entrée de configuration JavaScript généré pour les packages installés. Nécessite `setupEntry`, doit exister et doit rester dans le répertoire du package du Plugin. |
| `openclaw.channel`                                                                         | Métadonnées peu coûteuses du catalogue de canaux, comme les libellés, les chemins de documentation, les alias et le texte de sélection.                                              |
| `openclaw.channel.commands`                                                                | Métadonnées statiques de commandes natives et de valeurs par défaut automatiques de skill natif utilisées par la configuration, l’audit et les surfaces de liste de commandes avant le chargement du runtime du canal. |
| `openclaw.channel.configuredState`                                                         | Métadonnées légères de vérification de l’état configuré capables de répondre à « la configuration uniquement par variables d’environnement existe-t-elle déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                                                      | Métadonnées légères de vérification de l’authentification persistée capables de répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal.        |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indications d’installation/mise à jour pour les Plugins groupés et publiés en externe.                                                                                              |
| `openclaw.install.defaultChoice`                                                           | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                             |
| `openclaw.install.minHostVersion`                                                          | Version minimale prise en charge de l’hôte OpenClaw, utilisant un plancher semver comme `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                        |
| `openclaw.install.expectedIntegrity`                                                       | Chaîne d’intégrité npm dist attendue, comme `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à celle-ci.                           |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Autorise un chemin de récupération étroit par réinstallation de Plugin groupé lorsque la configuration est invalide.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permet aux surfaces de canal réservées à la configuration de se charger avant le Plugin de canal complet pendant le démarrage.                                                       |

Les métadonnées de manifeste décident quels choix de fournisseur/canal/configuration apparaissent dans
l’onboarding avant le chargement du runtime. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce Plugin lorsque l’utilisateur choisit l’une de ces
options. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du
registre des manifestes pour les sources de Plugin non groupées. Les valeurs invalides sont rejetées ;
les valeurs plus récentes mais valides ignorent les Plugins externes sur les hôtes plus anciens. Les Plugins
source groupés sont supposés être coversionnés avec le checkout de l’hôte.

Les métadonnées officielles d’installation à la demande doivent utiliser `clawhubSpec` lorsque le Plugin est
publié sur ClawHub ; l’onboarding traite cela comme la source distante préférée et
enregistre les faits d’artefact ClawHub après l’installation. `npmSpec` reste le repli de compatibilité
pour les packages qui ne sont pas encore passés à ClawHub.

L’épinglage exact de version npm se trouve déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles du catalogue externe
doivent associer des spécifications exactes à `expectedIntegrity` afin que les flux de mise à jour échouent
fermés si l’artefact npm récupéré ne correspond plus à la version épinglée.
L’onboarding interactif propose toujours des spécifications npm de registre fiables, y compris les
noms de packages nus et les dist-tags, pour compatibilité. Les diagnostics de catalogue peuvent
distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec incohérence de nom de package
et avec choix par défaut invalide. Ils avertissent aussi lorsque
`expectedIntegrity` est présent mais qu’il n’existe aucune source npm valide qu’il peut épingler.
Lorsque `expectedIntegrity` est présent,
les flux d’installation/mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est
enregistrée sans épingle d’intégrité.

Les Plugins de canal doivent fournir `openclaw.setupEntry` lorsque les analyses d’état, de liste de canaux
ou de SecretRef doivent identifier les comptes configurés sans charger le runtime complet.
L’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs de configuration,
d’état et de secrets sûrs pour la configuration ; conservez les clients réseau, les écouteurs Gateway et
les runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de frontière de package pour les champs
de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un
chemin `openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il ne
rend pas installables des configurations arbitrairement cassées. Aujourd’hui, il permet seulement aux flux
d’installation de récupérer après des échecs spécifiques de mise à niveau de Plugin groupé obsolète, comme un
chemin de Plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même
Plugin groupé. Les erreurs de configuration sans rapport bloquent toujours l’installation et envoient les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule module de vérification :

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Utilisez-la lorsque les flux de configuration, doctor, état ou présence en lecture seule ont besoin d’une sonde
d’authentification oui/non peu coûteuse avant le chargement du Plugin de canal complet. L’état d’authentification persisté n’est
pas l’état de canal configuré : n’utilisez pas ces métadonnées pour activer automatiquement des Plugins,
réparer les dépendances runtime ou décider si un runtime de canal doit se charger.
L’export cible doit être une petite fonction qui lit uniquement l’état persisté ; ne la
faites pas passer par le barrel complet du runtime de canal.

`openclaw.channel.configuredState` suit la même forme pour les vérifications peu coûteuses de configuration
uniquement par variables d’environnement :

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Utilisez-la lorsqu’un canal peut répondre à l’état configuré à partir des variables d’environnement ou d’autres petites
entrées non runtime. Si la vérification nécessite une résolution complète de la configuration ou le vrai
runtime de canal, conservez cette logique dans le hook `config.hasConfiguredState`
du Plugin à la place.

## Priorité de découverte (identifiants de Plugin en double)

OpenClaw découvre les Plugins depuis plusieurs racines (groupés, installation globale, workspace, chemins explicitement sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifeste de **plus haute priorité** est conservé ; les doublons de priorité inférieure sont abandonnés au lieu d’être chargés à côté de lui.

Priorité, de la plus élevée à la plus faible :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Groupé** — Plugins livrés avec OpenClaw
3. **Installation globale** — Plugins installés dans la racine globale des Plugins OpenClaw
4. **Workspace** — Plugins découverts relativement au workspace actuel

Implications :

- Une copie forkée ou obsolète d’un Plugin groupé présente dans le workspace ne masquera pas le build groupé.
- Pour remplacer réellement un Plugin groupé par un Plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par priorité plutôt que de s’appuyer sur la découverte du workspace.
- Les abandons de doublons sont journalisés afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.
- Les remplacements de doublons sélectionnés par la configuration sont formulés comme des remplacements explicites dans les diagnostics, mais avertissent tout de même afin que les forks obsolètes et les masquages accidentels restent visibles.

## Exigences du JSON Schema

- **Chaque Plugin doit livrer un JSON Schema**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas au runtime.
- Lorsque vous étendez ou forkez un Plugin groupé avec de nouvelles clés de configuration, mettez à jour en même temps le `configSchema` de `openclaw.plugin.json` de ce Plugin. Les schémas de Plugins groupés sont stricts, donc ajouter `plugins.entries.<id>.config.myNewKey` dans la configuration utilisateur sans ajouter `myNewKey` à `configSchema.properties` sera rejeté avant le chargement du runtime du Plugin.

Exemple d’extension de schéma :

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’identifiant du canal est déclaré par
  un manifeste de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des identifiants de Plugin **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si la configuration du Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor + les journaux.

Consultez la [référence de configuration](/fr/gateway/configuration) pour le schéma `plugins.*` complet.

## Notes

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local. Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte et à la validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les clés sans guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez les clés personnalisées de premier niveau.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerCatalogEntry` doit rester léger et ne doit pas importer de code runtime étendu ; utilisez-le pour les métadonnées statiques du catalogue de fournisseurs ou les descripteurs de découverte ciblés, pas pour l’exécution au moment des requêtes. `providerDiscoveryEntry` est l’orthographe héritée et fonctionne encore pour les plugins existants.
- Les types de plugins exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (`legacy` par défaut).
- Déclarez le type de plugin exclusif dans ce manifeste. `OpenClawPluginDefinition.kind` dans l’entrée runtime est obsolète et reste uniquement comme solution de compatibilité pour les plugins plus anciens.
- Les métadonnées de variables d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` obsolète et `channelEnvVars`) sont uniquement déclaratives. L’état, l’audit, la validation de la livraison Cron et les autres surfaces en lecture seule appliquent toujours la confiance du plugin et la politique d’activation effective avant de traiter une variable d’environnement comme configurée.
- Pour les métadonnées de l’assistant runtime qui nécessitent du code fournisseur, consultez [les hooks runtime des fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toutes les exigences de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Connexe

<CardGroup cols={3}>
  <Card title="Créer des plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Premiers pas avec les plugins.
  </Card>
  <Card title="Architecture Plugin" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="Vue d’ensemble du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK Plugin et imports de sous-chemins.
  </Card>
</CardGroup>
