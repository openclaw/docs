---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Manifeste de Plugin + exigences de schéma JSON (validation stricte de la configuration)
title: Manifeste du Plugin
x-i18n:
    generated_at: "2026-05-02T07:14:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 371a7364374df57c0b4a55229b86beea24140d0b352a54e8281e103bf66f5662
    source_path: plugins/manifest.md
    workflow: 16
---

Cette page concerne uniquement le **manifeste de plugin OpenClaw natif**.

Pour les structures de paquets compatibles, consultez [Paquets de Plugin](/fr/plugins/bundles).

Les formats de paquets compatibles utilisent des fichiers manifeste différents :

- Paquet Codex : `.codex-plugin/plugin.json`
- Paquet Claude : `.claude-plugin/plugin.json` ou la structure par défaut des composants Claude
  sans manifeste
- Paquet Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces structures de paquets, mais elles ne sont pas validées
avec le schéma `openclaw.plugin.json` décrit ici.

Pour les paquets compatibles, OpenClaw lit actuellement les métadonnées du paquet ainsi que les racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du paquet Claude,
les valeurs par défaut LSP du paquet Claude, et les packs de hooks pris en charge lorsque la structure correspond
aux attentes d’exécution d’OpenClaw.

Chaque plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme des
erreurs de plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Rôle de ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit **avant de charger votre
code de plugin**. Tout ce qui suit doit être assez peu coûteux à inspecter sans démarrer
l’exécution du plugin.

**Utilisez-le pour :**

- l’identité du plugin, la validation de la configuration et les indications d’interface de configuration
- les métadonnées d’authentification, d’intégration et de configuration initiale (alias, activation automatique, variables d’environnement de fournisseur, choix d’authentification)
- les indices d’activation pour les surfaces du plan de contrôle
- la propriété abrégée des familles de modèles
- les instantanés statiques de propriété des capacités (`contracts`)
- les métadonnées du lanceur QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration propres aux canaux fusionnées dans le catalogue et les surfaces de validation

**Ne l’utilisez pas pour :** enregistrer un comportement d’exécution, déclarer des points d’entrée de code
ou des métadonnées d’installation npm. Ces éléments appartiennent au code de votre plugin et à `package.json`.

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
| `id`                                 | Oui         | `string`                         | Identifiant canonique du plugin. C’est l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                                           |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Non         | `true`                           | Marque un plugin intégré comme activé par défaut. Omettez-le, ou définissez toute valeur non-`true`, pour laisser le plugin désactivé par défaut.                                                                                   |
| `legacyPluginIds`                    | Non         | `string[]`                       | Identifiants hérités qui se normalisent vers cet identifiant canonique de plugin.                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | Identifiants de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou des références de modèles les mentionnent.                                                               |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | Non         | `string[]`                       | Identifiants de canaux possédés par ce plugin. Utilisé pour la découverte et la validation de la configuration.                                                                                                                     |
| `providers`                          | Non         | `string[]`                       | Identifiants de fournisseurs possédés par ce plugin.                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Non         | `string`                         | Chemin de module léger de découverte de fournisseurs, relatif à la racine du plugin, pour les métadonnées de catalogue de fournisseurs limitées au manifeste qui peuvent être chargées sans activer le runtime complet du plugin.   |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées de familles de modèles possédées par le manifeste, utilisées pour charger automatiquement le plugin avant le runtime.                                                                                          |
| `modelCatalog`                       | Non         | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs possédés par ce plugin. C’est le contrat de plan de contrôle pour les futures listes en lecture seule, l’onboarding, les sélecteurs de modèles, les alias et la suppression sans charger le runtime du plugin. |
| `modelPricing`                       | Non         | `object`                         | Politique de recherche de tarifs externe possédée par le fournisseur. Utilisez-la pour exclure les fournisseurs locaux/auto-hébergés des catalogues de tarifs distants ou mapper les références de fournisseurs vers des identifiants de catalogue OpenRouter/LiteLLM sans coder en dur les identifiants de fournisseurs dans le cœur. |
| `modelIdNormalization`               | Non         | `object`                         | Nettoyage des alias/préfixes d’identifiants de modèles possédé par le fournisseur, qui doit s’exécuter avant le chargement du runtime du fournisseur.                                                                                |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl de terminaison possédées par le manifeste pour les routes de fournisseurs que le cœur doit classer avant le chargement du runtime du fournisseur.                                                        |
| `providerRequest`                    | Non         | `object`                         | Métadonnées légères de famille de fournisseurs et de compatibilité des requêtes utilisées par la politique générique de requêtes avant le chargement du runtime du fournisseur.                                                     |
| `cliBackends`                        | Non         | `string[]`                       | Identifiants de backends d’inférence CLI possédés par ce plugin. Utilisé pour l’activation automatique au démarrage à partir de références de configuration explicites.                                                            |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique possédé par le plugin doit être sondé pendant la découverte à froid des modèles avant le chargement du runtime.                            |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs de clés API de remplacement possédées par un plugin intégré qui représentent un état d’identifiants locaux, OAuth ou ambiants non secret.                                                                                   |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes possédés par ce plugin qui doivent produire des diagnostics de configuration et CLI conscients du plugin avant le chargement du runtime.                                                                           |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées d’environnement de compatibilité obsolètes pour la recherche d’authentification/de statut des fournisseurs. Préférez `setup.providers[].envVars` pour les nouveaux plugins ; OpenClaw continue de les lire pendant la période de dépréciation. |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | Identifiants de fournisseurs qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de codage qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées légères d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du plugin. Utilisez-les pour la configuration de canal pilotée par l’environnement ou les surfaces d’authentification que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des indicateurs CLI.                                                                    |
| `activation`                         | Non         | `object`                         | Métadonnées légères du planificateur d’activation pour le chargement déclenché par le démarrage, le fournisseur, la commande, le canal, la route et les capacités. Métadonnées uniquement ; le runtime du plugin possède toujours le comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du plugin.                                                                              |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du plugin.                                                                                                            |
| `contracts`                          | Non         | `object`                         | Instantané statique de propriété des capacités pour les hooks d’authentification externes, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de musique, la génération de vidéos, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les identifiants de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                  |
| `imageGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération d’images pour les identifiants de fournisseurs déclarés dans `contracts.imageGenerationProviders`, y compris les alias d’authentification possédés par le fournisseur et les garde-fous d’URL de base. |
| `videoGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération de vidéos pour les identifiants de fournisseurs déclarés dans `contracts.videoGenerationProviders`, y compris les alias d’authentification possédés par le fournisseur et les garde-fous d’URL de base. |
| `musicGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération de musique pour les identifiants de fournisseurs déclarés dans `contracts.musicGenerationProviders`, y compris les alias d’authentification possédés par le fournisseur et les garde-fous d’URL de base. |
| `toolMetadata`                       | Non         | `Record<string, object>`         | Métadonnées légères de disponibilité pour les outils possédés par le plugin déclarés dans `contracts.tools`. Utilisez-les lorsqu’un outil ne doit pas charger le runtime sauf si des éléments de preuve de configuration, d’environnement ou d’authentification existent. |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal possédées par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                        |
| `skills`                             | Non         | `string[]`                       | Répertoires Skills à charger, relatifs à la racine du plugin.                                                                                                                                                                      |
| `name`                               | Non         | `string`                         | Nom du plugin lisible par l’humain.                                                                                                                                                                                                |
| `description`                        | No       | `string`                         | Bref résumé affiché dans les surfaces du plugin.                                                                                                                                                                                    |
| `version`                            | No       | `string`                         | Version informative du plugin.                                                                                                                                                                                                      |
| `uiHints`                            | No       | `Record<string, object>`         | Libellés d’interface utilisateur, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                                                   |

## Référence des métadonnées de fournisseurs de génération

Les champs de métadonnées de fournisseur de génération décrivent des signaux d’authentification statiques pour les
fournisseurs déclarés dans la liste `contracts.*GenerationProviders` correspondante.
OpenClaw lit ces champs avant le chargement de l’environnement d’exécution du fournisseur afin que les outils du noyau puissent
déterminer si un fournisseur de génération est disponible sans importer chaque
plugin de fournisseur.

Utilisez ces champs uniquement pour des faits déclaratifs peu coûteux. Le transport, les transformations de requêtes,
l’actualisation des jetons, la validation des identifiants et le comportement réel de génération
restent dans l’environnement d’exécution du plugin.

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

Chaque entrée de métadonnées prend en charge :

| Champ           | Obligatoire | Type       | Signification                                                                                                                       |
| --------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Non         | `string[]` | Identifiants de fournisseur supplémentaires qui doivent compter comme alias d’authentification statiques pour le fournisseur de génération. |
| `authProviders` | Non         | `string[]` | Identifiants de fournisseur dont les profils d’authentification configurés doivent compter comme authentification pour ce fournisseur de génération. |
| `configSignals` | Non         | `object[]` | Signaux de disponibilité peu coûteux, basés uniquement sur la config, pour les fournisseurs locaux ou auto-hébergés pouvant être configurés sans profils d’authentification ni variables d’environnement. |
| `authSignals`   | Non         | `object[]` | Signaux d’authentification explicites. Lorsqu’ils sont présents, ils remplacent l’ensemble de signaux par défaut provenant de l’identifiant du fournisseur, de `aliases` et de `authProviders`. |

Chaque entrée `configSignals` prend en charge :

| Champ         | Obligatoire | Type       | Signification                                                                                                                                                                           |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Oui         | `string`   | Chemin en notation pointée vers l’objet de config détenu par le plugin à inspecter, par exemple `plugins.entries.example.config`. |
| `overlayPath` | Non         | `string`   | Chemin en notation pointée dans la config racine dont l’objet doit se superposer à l’objet racine avant l’évaluation du signal. Utilisez-le pour une config propre à une capacité, comme `image`, `video` ou `music`. |
| `required`    | Non         | `string[]` | Chemins en notation pointée dans la config effective qui doivent avoir des valeurs configurées. Les chaînes doivent être non vides ; les objets et les tableaux ne doivent pas être vides. |
| `requiredAny` | Non         | `string[]` | Chemins en notation pointée dans la config effective dont au moins un doit avoir une valeur configurée. |
| `mode`        | Non         | `object`   | Garde facultative de mode sous forme de chaîne dans la config effective. Utilisez-la lorsque la disponibilité basée uniquement sur la config ne s’applique qu’à un seul mode. |

Chaque garde `mode` prend en charge :

| Champ        | Obligatoire | Type       | Signification                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Non         | `string`   | Chemin en notation pointée dans la config effective. Par défaut : `mode`. |
| `default`    | Non         | `string`   | Valeur de mode à utiliser lorsque la config omet le chemin. |
| `allowed`    | Non         | `string[]` | S’il est présent, le signal ne passe que lorsque le mode effectif fait partie de ces valeurs. |
| `disallowed` | Non         | `string[]` | S’il est présent, le signal échoue lorsque le mode effectif fait partie de ces valeurs. |

Chaque entrée `authSignals` prend en charge :

| Champ             | Obligatoire | Type     | Signification                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui         | `string` | Identifiant de fournisseur à vérifier dans les profils d’authentification configurés. |
| `providerBaseUrl` | Non         | `object` | Garde facultative qui fait compter le signal uniquement lorsque le fournisseur configuré référencé utilise une URL de base autorisée. Utilisez-la lorsqu’un alias d’authentification n’est valide que pour certaines API. |

Chaque garde `providerBaseUrl` prend en charge :

| Champ             | Obligatoire | Type       | Signification                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui         | `string`   | Identifiant de config de fournisseur dont `baseUrl` doit être vérifié. |
| `defaultBaseUrl`  | Non         | `string`   | URL de base à supposer lorsque la config du fournisseur omet `baseUrl`. |
| `allowedBaseUrls` | Oui         | `string[]` | URL de base autorisées pour ce signal d’authentification. Le signal est ignoré lorsque l’URL de base configurée ou par défaut ne correspond à aucune de ces valeurs normalisées. |

## Référence des métadonnées d’outil

`toolMetadata` utilise les mêmes formes `configSignals` et `authSignals` que les
métadonnées de fournisseur de génération, indexées par nom d’outil. `contracts.tools` déclare
la propriété. `toolMetadata` déclare des preuves de disponibilité peu coûteuses afin qu’OpenClaw puisse
éviter d’importer un environnement d’exécution de plugin uniquement pour que sa fabrique d’outils retourne `null`.

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

Si un outil n’a pas de `toolMetadata`, OpenClaw préserve le comportement existant et
charge le plugin propriétaire lorsque le contrat de l’outil correspond à la politique. Pour les outils
sur les chemins critiques dont la fabrique dépend de l’authentification ou de la config, les auteurs de plugins doivent déclarer
`toolMetadata` au lieu de faire importer l’environnement d’exécution par le noyau pour l’interroger.

## Référence providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw la lit avant le chargement de l’environnement d’exécution du fournisseur.
Les listes de configuration de fournisseur utilisent ces choix de manifeste, les choix de configuration dérivés des descripteurs,
et les métadonnées du catalogue d’installation sans charger l’environnement d’exécution du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | Identifiant de fournisseur auquel ce choix appartient. |
| `method`              | Oui         | `string`                                        | Identifiant de méthode d’authentification vers laquelle effectuer la répartition. |
| `choiceId`            | Oui         | `string`                                        | Identifiant stable de choix d’authentification utilisé par les flux d’onboarding et de CLI. |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw se rabat sur `choiceId`. |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur. |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs basses sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l’assistant tout en autorisant toujours la sélection manuelle via la CLI. |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement. |
| `groupId`             | Non         | `string`                                        | Identifiant de groupe facultatif pour regrouper des choix associés. |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l’utilisateur pour ce groupe. |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe. |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul indicateur. |
| `cliFlag`             | Non         | `string`                                        | Nom d’indicateur CLI, par exemple `--openrouter-api-key`. |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, par exemple `--openrouter-api-key <key>`. |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide de la CLI. |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Surfaces d’onboarding dans lesquelles ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence commandAliases

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande d’exécution que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
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
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce plugin.                             |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme commande slash de chat plutôt que comme commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, s’il en existe une. |

## référence activation

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/chargement.

Ce bloc est constitué de métadonnées de planification, pas d’une API de cycle de vie. Il n’enregistre pas
de comportement d’exécution, ne remplace pas `register(...)` et ne garantit pas que
le code du plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
réduire les plugins candidats avant de se rabattre sur les métadonnées de propriété de manifeste existantes
telles que `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez les métadonnées les plus restreintes qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour des indications de planificateur
supplémentaires qui ne peuvent pas être représentées par ces champs de propriété.
Utilisez `cliBackends` au niveau supérieur pour les alias d’exécution CLI tels que `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` est réservé aux
ids de harnais d’agent intégrés qui n’ont pas déjà de champ de propriété.

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement d’exécution et il ne
remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée d’exécution/plugin.
Les consommateurs actuels l’utilisent comme indication de réduction avant un chargement plus large des plugins, donc
les métadonnées d’activation non liées au démarrage manquantes ne coûtent généralement que des performances; elles
ne doivent pas changer la correction tant que les solutions de repli de propriété du manifeste existent toujours.

Chaque plugin doit définir `activation.onStartup` intentionnellement. Définissez-le sur `true`
uniquement lorsque le plugin doit s’exécuter pendant le démarrage du Gateway. Définissez-le sur `false` lorsque
le plugin est inerte au démarrage et ne doit être chargé qu’à partir de déclencheurs plus restreints.
Omettre `onStartup` ne charge plus implicitement le plugin au démarrage; utilisez des
métadonnées d’activation explicites pour les déclencheurs d’activation de démarrage, de canal, de configuration, de harnais d’agent, de mémoire ou
d’autres déclencheurs plus restreints.

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
| `onStartup`        | Non         | `boolean`                                            | Activation explicite au démarrage du Gateway. Chaque plugin doit la définir. `true` importe le plugin pendant le démarrage; `false` le garde paresseux au démarrage, sauf si un autre déclencheur correspondant exige son chargement. |
| `onProviders`      | Non         | `string[]`                                           | Ids de fournisseurs qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                   |
| `onAgentHarnesses` | Non         | `string[]`                                           | Ids d’exécution de harnais d’agent intégrés qui doivent inclure ce plugin dans les plans d’activation/chargement. Utilisez `cliBackends` au niveau supérieur pour les alias de backend CLI. |
| `onCommands`       | Non         | `string[]`                                           | Ids de commandes qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                      |
| `onChannels`       | Non         | `string[]`                                           | Ids de canaux qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                         |
| `onRoutes`         | Non         | `string[]`                                           | Types de routes qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                       |
| `onConfigPaths`    | Non         | `string[]`                                           | Chemins de configuration relatifs à la racine qui doivent inclure ce plugin dans les plans de démarrage/chargement lorsque le chemin est présent et n’est pas explicitement désactivé.       |
| `onCapabilities`   | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications de capacité larges utilisées par la planification d’activation du plan de contrôle. Préférez les champs plus restreints lorsque possible.                                      |

Consommateurs live actuels :

- La planification du démarrage du Gateway utilise `activation.onStartup` pour l’import
  explicite au démarrage
- la planification CLI déclenchée par une commande se rabat sur les anciens
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification du démarrage de l’exécution d’agent utilise `activation.onAgentHarnesses` pour
  les harnais intégrés et `cliBackends[]` au niveau supérieur pour les alias d’exécution CLI
- la planification de configuration/canal déclenchée par un canal se rabat sur l’ancienne propriété `channels[]`
  lorsque les métadonnées d’activation de canal explicites sont absentes
- la planification des plugins au démarrage utilise `activation.onConfigPaths` pour les surfaces de configuration racine
  hors canal, telles que le bloc `browser` du plugin de navigateur intégré
- la planification de configuration/exécution déclenchée par un fournisseur se rabat sur l’ancienne propriété
  `providers[]` et `cliBackends[]` au niveau supérieur lorsque les métadonnées d’activation de fournisseur explicites
  sont absentes

Les diagnostics du planificateur peuvent distinguer les indications d’activation explicites du repli sur la
propriété du manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` correspondait, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces libellés de raison servent aux
diagnostics de l’hôte et aux tests; les auteurs de plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## référence qaRunners

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
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.     |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

## référence setup

Utilisez `setup` lorsque les surfaces de configuration et d’intégration ont besoin de métadonnées peu coûteuses détenues par le plugin
avant le chargement de l’exécution.

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
`setup.cliBackends` est la surface de descripteur spécifique à la configuration pour
les flux de plan de contrôle/configuration qui doivent rester uniquement des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
privilégiée basée sur les descripteurs pour la découverte de configuration. Si le descripteur ne fait que
réduire le plugin candidat et que la configuration a encore besoin de hooks d’exécution plus riches au moment de la configuration,
définissez `requiresRuntime: true` et gardez `setup-api` en place comme
chemin d’exécution de repli.

OpenClaw inclut également `setup.providers[].envVars` dans les recherches génériques d’authentification de fournisseur et
de variables d’environnement. `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
pendant la fenêtre de dépréciation, mais les plugins non intégrés qui l’utilisent encore
reçoivent un diagnostic de manifeste. Les nouveaux plugins doivent placer les métadonnées d’environnement de configuration/statut
sur `setup.providers[].envVars`.

OpenClaw peut également déduire des choix de configuration simples depuis `setup.providers[].authMethods`
lorsqu’aucune entrée de configuration n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que l’exécution de configuration est inutile. Les entrées explicites `providerAuthChoices` restent
préférées pour les libellés personnalisés, les options CLI, la portée d’intégration et les métadonnées d’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs sont suffisants pour la
surface de configuration. OpenClaw traite `false` explicite comme un contrat uniquement basé sur des descripteurs
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche de configuration. Si
un plugin uniquement basé sur des descripteurs fournit tout de même l’une de ces entrées d’exécution de configuration,
OpenClaw signale un diagnostic additif et continue de l’ignorer. L’omission de
`requiresRuntime` conserve le comportement de repli hérité afin que les plugins existants qui ont ajouté
des descripteurs sans l’indicateur ne se cassent pas.

Comme la recherche de configuration peut exécuter du code `setup-api` détenu par le plugin, les valeurs normalisées
`setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les
plugins découverts. Une propriété ambiguë échoue de manière fermée au lieu de choisir un
gagnant selon l’ordre de découverte.

Lorsque l’exécution de configuration s’exécute, les diagnostics du registre de configuration signalent une dérive des descripteurs
si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs de manifeste
ne déclarent pas, ou si un descripteur n’a pas d’enregistrement d’exécution correspondant.
Ces diagnostics sont additifs et ne rejettent pas les plugins hérités.

### référence setup.providers

| Champ          | Obligatoire | Type       | Signification                                                                                    |
| -------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Oui         | `string`   | Id de fournisseur exposé pendant la configuration ou l’intégration. Gardez les ids normalisés globalement uniques. |
| `authMethods`  | Non         | `string[]` | Ids de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger l’exécution complète. |
| `envVars`      | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement de l’exécution du plugin. |
| `authEvidence` | Non         | `object[]` | Vérifications peu coûteuses de preuves d’authentification locales pour les fournisseurs qui peuvent s’authentifier via des marqueurs non secrets. |

`authEvidence` sert aux marqueurs locaux d'identifiants détenus par les fournisseurs qui peuvent être vérifiés sans charger de code d'exécution. Ces vérifications doivent rester peu coûteuses et locales : aucun appel réseau, aucune lecture du trousseau ou du gestionnaire de secrets, aucune commande shell, et aucune sonde d'API fournisseur.

Entrées de preuve prises en charge :

| Champ              | Obligatoire | Type       | Signification                                                                                                      |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `type`             | Oui         | `string`   | Actuellement `local-file-with-env`.                                                                                |
| `fileEnvVar`       | Non         | `string`   | Variable d'environnement contenant un chemin explicite vers le fichier d'identifiants.                             |
| `fallbackPaths`    | Non         | `string[]` | Chemins locaux de fichiers d'identifiants vérifiés lorsque `fileEnvVar` est absente ou vide. Prend en charge `${HOME}` et `${APPDATA}`. |
| `requiresAnyEnv`   | Non         | `string[]` | Au moins une variable d'environnement listée doit être non vide pour que la preuve soit valide.                    |
| `requiresAllEnv`   | Non         | `string[]` | Toutes les variables d'environnement listées doivent être non vides pour que la preuve soit valide.                |
| `credentialMarker` | Oui         | `string`   | Marqueur non secret renvoyé lorsque la preuve est présente.                                                        |
| `source`           | Non         | `string`   | Libellé de source visible par l'utilisateur pour la sortie d'authentification/d'état.                              |

### champs setup

| Champ              | Obligatoire | Type       | Signification                                                                                                      |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseurs exposés pendant la configuration et l'onboarding.                    |
| `cliBackends`      | Non         | `string[]` | Identifiants de backends utilisés au moment de la configuration pour une recherche de configuration fondée d'abord sur les descripteurs. Gardez les identifiants normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | Identifiants de migration de configuration détenus par la surface de configuration de ce Plugin.                   |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration nécessite encore l'exécution de `setup-api` après la recherche de descripteur.         |

## référence uiHints

`uiHints` est une table qui associe les noms de champs de configuration à de petites indications de rendu.

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

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                                      |
| ------------- | ---------- | -------------------------------------------------- |
| `label`       | `string`   | Libellé de champ visible par l'utilisateur.        |
| `help`        | `string`   | Court texte d'aide.                                |
| `tags`        | `string[]` | Étiquettes d'interface facultatives.               |
| `advanced`    | `boolean`  | Marque le champ comme avancé.                      |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible.          |
| `placeholder` | `string`   | Texte d'espace réservé pour les champs de formulaire. |

## référence contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu'OpenClaw peut lire sans importer l'exécution du Plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Identifiants de fabriques d'extensions de serveur d'application Codex, actuellement `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identifiants d'exécution pour lesquels un Plugin groupé peut enregistrer un middleware de résultat d'outil. |
| `externalAuthProviders`          | `string[]` | Identifiants de fournisseurs dont ce Plugin détient le hook de profil d'authentification externe. |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de parole détenus par ce Plugin.         |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription en temps réel détenus par ce Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs vocaux en temps réel détenus par ce Plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants de fournisseurs d'embeddings de mémoire détenus par ce Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension multimédia détenus par ce Plugin. |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d'images détenus par ce Plugin. |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération vidéo détenus par ce Plugin. |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération web détenus par ce Plugin. |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche web détenus par ce Plugin.  |
| `migrationProviders`             | `string[]` | Identifiants de fournisseurs d'importation détenus par ce Plugin pour `openclaw migrate`. |
| `tools`                          | `string[]` | Noms d'outils d'agent détenus par ce Plugin.                          |

`contracts.embeddedExtensionFactories` est conservé pour les fabriques d'extensions groupées réservées au serveur d'application Codex. Les transformations groupées de résultats d'outils doivent plutôt déclarer `contracts.agentToolResultMiddleware` et s'enregistrer avec `api.registerAgentToolResultMiddleware(...)`. Les Plugins externes ne peuvent pas enregistrer de middleware de résultat d'outil, car cette jonction peut réécrire une sortie d'outil à haut niveau de confiance avant que le modèle ne la voie.

Les enregistrements d'exécution `api.registerTool(...)` doivent correspondre à `contracts.tools`. La découverte d'outils utilise cette liste pour ne charger que les exécutions de Plugins pouvant détenir les outils demandés.

Les Plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer `contracts.externalAuthProviders`. Les Plugins sans cette déclaration passent encore par une solution de compatibilité obsolète, mais celle-ci est plus lente et sera supprimée après la fenêtre de migration.

Les fournisseurs groupés d'embeddings de mémoire doivent déclarer `contracts.memoryEmbeddingProviders` pour chaque identifiant d'adaptateur qu'ils exposent, y compris les adaptateurs intégrés comme `local`. Les chemins CLI autonomes utilisent ce contrat de manifeste pour ne charger que le Plugin propriétaire avant que l'exécution complète du Gateway n'ait enregistré les fournisseurs.

## référence mediaUnderstandingProviderMetadata

Utilisez `mediaUnderstandingProviderMetadata` lorsqu'un fournisseur de compréhension multimédia possède des modèles par défaut, une priorité de solution de repli d'authentification automatique ou une prise en charge native des documents dont les assistants génériques du cœur ont besoin avant le chargement de l'exécution. Les clés doivent également être déclarées dans `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités multimédias exposées par ce fournisseur.                           |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut de capacité vers modèle utilisées lorsque la configuration ne précise pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus bas sont triés plus tôt pour la solution de repli automatique de fournisseur fondée sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de documents natives prises en charge par le fournisseur.             |

## référence channelConfigs

Utilisez `channelConfigs` lorsqu'un Plugin de canal a besoin de métadonnées de configuration peu coûteuses avant le chargement de l'exécution. La découverte en lecture seule de configuration/d'état de canal peut utiliser ces métadonnées directement pour les canaux externes configurés lorsqu'aucune entrée de configuration n'est disponible, ou lorsque `setup.requiresRuntime: false` déclare que l'exécution de configuration est inutile.

`channelConfigs` correspond à des métadonnées de manifeste de Plugin, pas à une nouvelle section de configuration utilisateur de premier niveau. Les utilisateurs configurent toujours les instances de canal sous `channels.<channel-id>`. OpenClaw lit les métadonnées de manifeste pour décider quel Plugin détient ce canal configuré avant l'exécution du code d'exécution du Plugin.

Pour un Plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les Plugins non groupés qui déclarent `channels[]` doivent également déclarer des entrées `channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le Plugin, mais le schéma de configuration du chemin froid, la configuration et les surfaces de Control UI ne peuvent pas connaître la forme des options détenues par le canal avant l'exécution du Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et `nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut statiques `auto` pour les vérifications de configuration de commandes qui s'exécutent avant le chargement de l'exécution du canal. Les canaux groupés peuvent aussi publier les mêmes valeurs par défaut via `package.json#openclaw.channel.commands` avec leurs autres métadonnées de catalogue de canal détenues par le package.

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
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Requis pour chaque entrée de configuration de canal déclarée.         |
| `uiHints`     | `Record<string, object>` | Libellés/espaces réservés/indications sensibles d’interface utilisateur facultatifs pour cette section de configuration de canal.          |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées de runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.                               |
| `commands`    | `object`                 | Commande native statique et valeurs par défaut automatiques de Skills natives pour les vérifications de configuration avant le runtime.       |
| `preferOver`  | `string[]`               | IDs de plugins hérités ou de priorité inférieure que ce canal doit devancer dans les surfaces de sélection.    |

### Remplacer un autre Plugin de canal

Utilisez `preferOver` lorsque votre Plugin est le propriétaire préféré pour un ID de canal qu’un
autre Plugin peut également fournir. Les cas courants sont un ID de Plugin renommé, un
Plugin autonome qui remplace un Plugin intégré, ou un fork maintenu qui
conserve le même ID de canal pour la compatibilité de la configuration.

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

Lorsque `channels.chat` est configuré, OpenClaw prend en compte à la fois l’ID de canal et
l’ID de Plugin préféré. Si le Plugin de priorité inférieure n’a été sélectionné que parce
qu’il est intégré ou activé par défaut, OpenClaw le désactive dans la configuration
de runtime effective afin qu’un seul Plugin possède le canal et ses outils. La sélection
explicite de l’utilisateur reste prioritaire : si l’utilisateur active explicitement les deux Plugins, OpenClaw
conserve ce choix et signale des diagnostics de canal/outil en double au lieu de
modifier silencieusement l’ensemble de Plugins demandé.

Gardez `preferOver` limité aux IDs de Plugins qui peuvent réellement fournir le même canal.
Ce n’est pas un champ de priorité général et il ne renomme pas les clés de configuration utilisateur.

## Référence `modelSupport`

Utilisez `modelSupport` lorsque OpenClaw doit déduire votre Plugin fournisseur à partir
d’IDs de modèles abrégés comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement
du runtime du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cet ordre de priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` propriétaires
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un Plugin non intégré et un Plugin intégré correspondent tous les deux, le Plugin non intégré
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs de modèles abrégés.                 |
| `modelPatterns` | `string[]` | Sources d’expressions régulières comparées aux IDs de modèles abrégés après suppression du suffixe de profil. |

## Référence `modelCatalog`

Utilisez `modelCatalog` lorsque OpenClaw doit connaître les métadonnées de modèles du fournisseur avant
le chargement du runtime du Plugin. Il s’agit de la source détenue par le manifeste pour les lignes de catalogue
fixes, les alias de fournisseur, les règles de suppression et le mode de découverte. L’actualisation du runtime
appartient toujours au code de runtime du fournisseur, mais le manifeste indique au cœur quand le runtime
est requis.

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
| `providers`    | `Record<string, object>`                                 | Lignes de catalogue pour les IDs de fournisseurs détenus par ce Plugin. Les clés doivent aussi apparaître dans `providers` au premier niveau.       |
| `aliases`      | `Record<string, object>`                                 | Alias de fournisseurs qui doivent se résoudre vers un fournisseur détenu pour la planification du catalogue ou des suppressions.              |
| `suppressions` | `object[]`                                               | Lignes de modèle d’une autre source que ce Plugin supprime pour une raison propre au fournisseur.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées de manifeste, actualisé dans le cache, ou s’il nécessite le runtime. |

`aliases` participe à la recherche de propriété de fournisseur pour la planification du catalogue de modèles.
Les cibles d’alias doivent être des fournisseurs de premier niveau détenus par le même Plugin. Lorsqu’une
liste filtrée par fournisseur utilise un alias, OpenClaw peut lire le manifeste propriétaire et
appliquer les remplacements d’API/URL de base de l’alias sans charger le runtime du fournisseur.
Les alias n’étendent pas les listes de catalogue non filtrées ; les listes larges n’émettent que les lignes du fournisseur
canonique propriétaire.

`suppressions` remplace l’ancien hook de runtime fournisseur `suppressBuiltInModel`.
Les entrées de suppression ne sont respectées que lorsque le fournisseur est détenu par le Plugin ou
déclaré comme clé `modelCatalog.aliases` ciblant un fournisseur détenu. Les hooks de suppression
du runtime ne sont plus appelés pendant la résolution de modèle.

Champs de fournisseur :

| Champ     | Type                     | Signification                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL de base par défaut facultative pour les modèles de ce catalogue fournisseur.    |
| `api`     | `ModelApi`               | Adaptateur d’API par défaut facultatif pour les modèles de ce catalogue fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques facultatifs qui s’appliquent à ce catalogue fournisseur.      |
| `models`  | `object[]`               | Lignes de modèle requises. Les lignes sans `id` sont ignorées.            |

Champs de modèle :

| Champ           | Type                                                           | Signification                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modèle local au fournisseur, sans le préfixe `provider/`.                    |
| `name`          | `string`                                                       | Nom d’affichage facultatif.                                                      |
| `api`           | `ModelApi`                                                     | Remplacement d’API facultatif propre au modèle.                                            |
| `baseUrl`       | `string`                                                       | Remplacement d’URL de base facultatif propre au modèle.                                       |
| `headers`       | `Record<string, string>`                                       | En-têtes statiques facultatifs propres au modèle.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalités acceptées par le modèle.                                               |
| `reasoning`     | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.                               |
| `contextWindow` | `number`                                                       | Fenêtre de contexte native du fournisseur.                                             |
| `contextTokens` | `number`                                                       | Plafond de contexte effectif facultatif au runtime lorsqu’il diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de tokens de sortie lorsqu’il est connu.                                           |
| `cost`          | `object`                                                       | Tarification facultative en USD par million de tokens, incluant `tieredPricing` facultatif. |
| `compat`        | `object`                                                       | Indicateurs de compatibilité facultatifs correspondant à la compatibilité de configuration de modèle OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | État de la liste. Supprimez uniquement lorsque la ligne ne doit pas apparaître du tout.          |
| `statusReason`  | `string`                                                       | Raison facultative affichée avec un état non disponible.                            |
| `replaces`      | `string[]`                                                     | Anciens IDs de modèles locaux au fournisseur que ce modèle remplace.                       |
| `replacedBy`    | `string`                                                       | ID de modèle local au fournisseur remplaçant pour les lignes obsolètes.                    |
| `tags`          | `string[]`                                                     | Étiquettes stables utilisées par les sélecteurs et les filtres.                                    |

Champs de suppression :

| Champ                      | Type       | Signification                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID de fournisseur pour la ligne amont à supprimer. Doit être détenu par ce Plugin ou déclaré comme alias détenu. |
| `model`                    | `string`   | ID de modèle local au fournisseur à supprimer.                                                                      |
| `reason`                   | `string`   | Message facultatif affiché lorsque la ligne supprimée est demandée directement.                                     |
| `when.baseUrlHosts`        | `string[]` | Liste facultative des hôtes d’URL de base effectifs du fournisseur requis avant l’application de la suppression.               |
| `when.providerConfigApiIn` | `string[]` | Liste facultative des valeurs exactes `api` de configuration du fournisseur requises avant l’application de la suppression.              |

Ne placez pas de données uniquement d’exécution dans `modelCatalog`. Utilisez `static` uniquement lorsque les lignes du manifeste
sont assez complètes pour que les surfaces de liste filtrée par fournisseur et de sélecteur puissent éviter
la découverte par registre/exécution. Utilisez `refreshable` lorsque les lignes du manifeste sont des graines
ou compléments listables utiles, mais qu’un rafraîchissement/cache peut ajouter d’autres lignes plus tard ;
les lignes refreshable ne font pas autorité à elles seules. Utilisez `runtime` lorsqu’OpenClaw
doit charger l’exécution du fournisseur pour connaître la liste.

## Référence modelIdNormalization

Utilisez `modelIdNormalization` pour un nettoyage peu coûteux des identifiants de modèle, détenu par le fournisseur, qui doit
avoir lieu avant le chargement de l’exécution du fournisseur. Cela conserve les alias tels que les noms de modèle courts,
les identifiants hérités locaux au fournisseur et les règles de préfixe de proxy dans le manifeste du Plugin
propriétaire plutôt que dans les tables centrales de sélection de modèle.

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
| `aliases`                            | `Record<string,string>` | Alias exacts d’identifiants de modèle, insensibles à la casse. Les valeurs sont renvoyées telles qu’écrites.                  |
| `stripPrefixes`                      | `string[]`              | Préfixes à supprimer avant la recherche d’alias, utiles pour les duplications héritées fournisseur/modèle.     |
| `prefixWhenBare`                     | `string`                | Préfixe à ajouter lorsque l’identifiant de modèle normalisé ne contient pas déjà `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Règles conditionnelles de préfixe d’identifiant nu après la recherche d’alias, indexées par `modelPrefix` et `prefix`. |

## Référence providerEndpoints

Utilisez `providerEndpoints` pour la classification des endpoints que la politique de requête générique
doit connaître avant le chargement de l’exécution du fournisseur. Le cœur possède toujours la signification de chaque
`endpointClass` ; les manifestes de Plugin possèdent les métadonnées d’hôte et d’URL de base.

Champs d’endpoint :

| Champ                          | Type       | Signification                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe d’endpoint connue du cœur, telle que `openrouter`, `moonshot-native` ou `google-vertex`.        |
| `hosts`                        | `string[]` | Noms d’hôte exacts qui correspondent à la classe d’endpoint.                                                |
| `hostSuffixes`                 | `string[]` | Suffixes d’hôte qui correspondent à la classe d’endpoint. Préfixez avec `.` pour une correspondance limitée aux suffixes de domaine. |
| `baseUrls`                     | `string[]` | URL de base HTTP(S) normalisées exactes qui correspondent à la classe d’endpoint.                             |
| `googleVertexRegion`           | `string`   | Région Google Vertex statique pour les hôtes globaux exacts.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffixe à retirer des hôtes correspondants pour exposer le préfixe de région Google Vertex.                 |

## Référence providerRequest

Utilisez `providerRequest` pour les métadonnées peu coûteuses de compatibilité des requêtes dont la politique
de requête générique a besoin sans charger l’exécution du fournisseur. Gardez la réécriture de charge utile
propre au comportement dans les hooks d’exécution du fournisseur ou dans des assistants partagés de famille de fournisseurs.

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
| `compatibilityFamily` | `"moonshot"` | Compartiment facultatif de compatibilité de famille de fournisseurs pour les assistants partagés de requêtes.              |
| `openAICompletions`   | `object`     | Indicateurs de requête de complétions compatibles avec OpenAI, actuellement `supportsStreamingUsage`.       |

## Référence modelPricing

Utilisez `modelPricing` lorsqu’un fournisseur a besoin d’un comportement de tarification du plan de contrôle avant
le chargement de l’exécution. Le cache de tarification du Gateway lit ces métadonnées sans importer
le code d’exécution du fournisseur.

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
| `external`   | `boolean`         | Définissez `false` pour les fournisseurs locaux/auto-hébergés qui ne doivent jamais récupérer les tarifs OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mappage de recherche de tarification OpenRouter. `false` désactive la recherche OpenRouter pour ce fournisseur.           |
| `liteLLM`    | `false \| object` | Mappage de recherche de tarification LiteLLM. `false` désactive la recherche LiteLLM pour ce fournisseur.                 |

Champs source :

| Champ                      | Type               | Signification                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identifiant de fournisseur de catalogue externe lorsqu’il diffère de l’identifiant de fournisseur OpenClaw, par exemple `z-ai` pour un fournisseur `zai`. |
| `passthroughProviderModel` | `boolean`          | Traite les identifiants de modèle contenant une barre oblique comme des références fournisseur/modèle imbriquées, utile pour les fournisseurs proxy tels qu’OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes supplémentaires d’identifiant de modèle de catalogue externe. `version-dots` essaie des identifiants de version avec points comme `claude-opus-4.6`.            |

### Index des fournisseurs OpenClaw

L’index des fournisseurs OpenClaw est une métadonnée d’aperçu détenue par OpenClaw pour les fournisseurs
dont les Plugins ne sont peut-être pas encore installés. Il ne fait pas partie d’un manifeste de Plugin.
Les manifestes de Plugin restent l’autorité pour les Plugins installés. L’index des fournisseurs est
le contrat de secours interne que les futures surfaces de fournisseur installable et de sélecteur de modèle
avant installation consommeront lorsqu’un Plugin de fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. `modelCatalog` du manifeste de Plugin installé.
3. Cache du catalogue de modèles issu d’un rafraîchissement explicite.
4. Lignes d’aperçu de l’index des fournisseurs OpenClaw.

L’index des fournisseurs ne doit pas contenir de secrets, d’état activé, de hooks d’exécution ni
de données de modèles propres à un compte en direct. Ses catalogues d’aperçu utilisent la même
forme de ligne de fournisseur `modelCatalog` que les manifestes de Plugin, mais doivent rester limités
aux métadonnées d’affichage stables, sauf si des champs d’adaptateur d’exécution tels que `api`,
`baseUrl`, la tarification ou les indicateurs de compatibilité sont intentionnellement maintenus alignés avec
le manifeste de Plugin installé. Les fournisseurs avec découverte `/models` en direct doivent
écrire les lignes rafraîchies via le chemin explicite de cache du catalogue de modèles plutôt que de
faire appeler les API du fournisseur par les opérations normales de liste ou d’onboarding.

Les entrées de l’index des fournisseurs peuvent également contenir des métadonnées de Plugin installable pour les fournisseurs
dont le Plugin a été déplacé hors du cœur ou n’est pas encore installé autrement. Ces
métadonnées reprennent le modèle du catalogue de canaux : nom du paquet, spécification d’installation npm,
intégrité attendue et libellés peu coûteux de choix d’authentification suffisent pour afficher une
option de configuration installable. Une fois le Plugin installé, son manifeste prévaut et
l’entrée de l’index des fournisseurs est ignorée pour ce fournisseur.

Les clés de capacité héritées de premier niveau sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de premier niveau comme une propriété
de capacité.

## Manifeste ou package.json

Les deux fichiers servent des objectifs différents :

| Fichier                   | Utilisation                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’UI qui doivent exister avant l’exécution du code du Plugin                         |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le filtrage d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du Plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne l’empaquetage, les fichiers d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs package.json qui affectent la découverte

Certaines métadonnées de Plugin avant exécution résident intentionnellement dans `package.json` sous le
bloc `openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                            | Signification                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                            | Déclare les points d’entrée natifs des plugins. Doit rester dans le répertoire du package du plugin.                                                                                                    |
| `openclaw.runtimeExtensions`                                     | Déclare les points d’entrée runtime JavaScript compilés pour les packages installés. Doit rester dans le répertoire du package du plugin.                                                               |
| `openclaw.setupEntry`                                            | Point d’entrée léger réservé à la configuration, utilisé pendant l’onboarding, le démarrage différé du canal et la découverte en lecture seule de l’état du canal/des SecretRef. Doit rester dans le répertoire du package du plugin. |
| `openclaw.runtimeSetupEntry`                                     | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Exige `setupEntry`, doit exister et doit rester dans le répertoire du package du plugin.                    |
| `openclaw.channel`                                               | Métadonnées légères du catalogue de canaux, comme les libellés, les chemins de documentation, les alias et le texte de sélection.                                                                        |
| `openclaw.channel.commands`                                      | Métadonnées statiques de commandes natives et de valeurs par défaut automatiques de Skills natives, utilisées par les surfaces de configuration, d’audit et de liste des commandes avant le chargement du runtime du canal. |
| `openclaw.channel.configuredState`                               | Métadonnées légères de vérification de l’état configuré pouvant répondre à « une configuration uniquement via l’environnement existe-t-elle déjà ? » sans charger le runtime complet du canal.          |
| `openclaw.channel.persistedAuthState`                            | Métadonnées légères de vérification de l’authentification persistée pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal.                              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`        | Indications d’installation/mise à jour pour les plugins groupés et publiés en externe.                                                                                                                   |
| `openclaw.install.defaultChoice`                                 | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                                                 |
| `openclaw.install.minHostVersion`                                | Version minimale prise en charge de l’hôte OpenClaw, avec un plancher semver comme `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                               |
| `openclaw.install.expectedIntegrity`                             | Chaîne d’intégrité npm dist attendue, par exemple `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré avec cette valeur.                                             |
| `openclaw.install.allowInvalidConfigRecovery`                    | Autorise un chemin étroit de récupération par réinstallation d’un plugin groupé lorsque la configuration est invalide.                                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet pendant le démarrage.                                                                           |

Les métadonnées du manifeste décident quels choix de fournisseur/canal/configuration apparaissent dans
l’onboarding avant le chargement du runtime. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce plugin lorsque l’utilisateur choisit l’une de ces
options. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre
des manifestes pour les sources de plugins non groupées. Les valeurs invalides sont rejetées ;
les valeurs plus récentes mais valides ignorent les plugins externes sur les hôtes plus anciens. Les plugins source groupés
sont supposés être coversionnés avec le checkout de l’hôte.

L’épinglage exact de version npm réside déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées du catalogue externe officiel
doivent associer des spécifications exactes à `expectedIntegrity` afin que les flux de mise à jour échouent
fermés si l’artefact npm récupéré ne correspond plus à la version épinglée.
L’onboarding interactif propose toujours des spécifications npm de registre approuvées, y compris les noms de packages nus
et les dist-tags, par compatibilité. Les diagnostics du catalogue peuvent
distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec
nom de package discordant et avec choix par défaut invalide. Ils avertissent également lorsque
`expectedIntegrity` est présent mais qu’il n’existe aucune source npm valide à laquelle l’épingler.
Lorsque `expectedIntegrity` est présent,
les flux d’installation/mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est
enregistrée sans épingle d’intégrité.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque les analyses d’état, de liste de canaux
ou de SecretRef doivent identifier les comptes configurés sans charger le runtime complet.
L’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs de configuration,
d’état et de secrets sûrs pour la configuration ; conservez les clients réseau, les écouteurs Gateway et les
runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de frontière de package pour les champs
de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un chemin
`openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il ne rend pas
installables des configurations arbitrairement cassées. Aujourd’hui, il permet seulement aux flux d’installation
de récupérer après des échecs précis de mise à niveau de plugins groupés obsolètes, comme un
chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin groupé. Les erreurs de configuration sans rapport bloquent toujours l’installation et envoient les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule module
de vérification :

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

Utilisez-la lorsque les flux de configuration, Doctor, d’état ou de présence en lecture seule ont besoin d’une sonde
d’authentification oui/non peu coûteuse avant le chargement du plugin de canal complet. L’état d’authentification persisté n’est
pas l’état de canal configuré : n’utilisez pas ces métadonnées pour activer automatiquement des plugins,
réparer des dépendances runtime ou décider si un runtime de canal doit se charger.
L’export cible doit être une petite fonction qui lit uniquement l’état persisté ; ne
le faites pas passer par le barrel du runtime complet du canal.

`openclaw.channel.configuredState` suit la même forme pour les vérifications peu coûteuses de configuration
uniquement via l’environnement :

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

Utilisez-la lorsqu’un canal peut répondre à l’état configuré depuis l’environnement ou d’autres petites
entrées non runtime. Si la vérification nécessite une résolution complète de la configuration ou le vrai
runtime du canal, conservez cette logique dans le hook `config.hasConfiguredState`
du plugin.

## Priorité de découverte (identifiants de plugins en double)

OpenClaw découvre les plugins depuis plusieurs racines (groupés, installation globale, espace de travail, chemins explicitement sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifeste à la **priorité la plus élevée** est conservé ; les doublons de priorité inférieure sont écartés au lieu d’être chargés à côté de lui.

Priorité, de la plus élevée à la plus faible :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Groupé** — plugins livrés avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Espace de travail** — plugins découverts relativement à l’espace de travail actuel

Implications :

- Une copie forkée ou obsolète d’un plugin groupé située dans l’espace de travail ne masquera pas la version groupée.
- Pour réellement remplacer un plugin groupé par un plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par priorité plutôt que de dépendre de la découverte de l’espace de travail.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, et non au runtime.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’identifiant du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des identifiants de plugins **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les journaux.

Consultez la [référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Notes

- Le manifeste est **requis pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local. Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez les clés personnalisées de premier niveau.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerDiscoveryEntry` doit rester léger et ne doit pas importer de code runtime large ; utilisez-le pour les métadonnées statiques du catalogue de fournisseurs ou des descripteurs de découverte étroits, et non pour l’exécution au moment de la requête.
- Les types de plugins exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (par défaut `legacy`).
- Déclarez le type de plugin exclusif dans ce manifeste. `OpenClawPluginDefinition.kind` de l’entrée runtime est obsolète et reste seulement comme solution de compatibilité pour les anciens plugins.
- Les métadonnées de variables d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` obsolète et `channelEnvVars`) sont uniquement déclaratives. L’état, l’audit, la validation de livraison Cron et les autres surfaces en lecture seule appliquent toujours la politique de confiance du plugin et d’activation effective avant de traiter une variable d’environnement comme configurée.
- Pour les métadonnées d’assistant runtime qui nécessitent du code fournisseur, consultez les [hooks runtime de fournisseur](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toutes les exigences d’autorisation du gestionnaire de packages (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Associé

<CardGroup cols={3}>
  <Card title="Créer des plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Premiers pas avec les plugins.
  </Card>
  <Card title="Architecture des plugins" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="Vue d’ensemble du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK Plugin et imports de sous-chemins.
  </Card>
</CardGroup>
