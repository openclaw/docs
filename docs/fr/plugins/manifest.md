---
read_when:
    - Vous développez un Plugin OpenClaw
    - Vous devez publier un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Manifeste de Plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifeste du Plugin
x-i18n:
    generated_at: "2026-05-02T20:49:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
    source_path: plugins/manifest.md
    workflow: 16
---

Cette page concerne uniquement le **manifeste de plugin natif OpenClaw**.

Pour les dispositions de bundles compatibles, consultez [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundles compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundles, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les racines
de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes d’exécution d’OpenClaw.

Chaque plugin natif OpenClaw **doit** fournir un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou non valides sont traités comme des
erreurs de plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Rôle de ce fichier

`openclaw.plugin.json` est la métadonnée qu’OpenClaw lit **avant de charger votre
code de plugin**. Tout ce qui suit doit être suffisamment léger pour être inspecté sans démarrer
l’environnement d’exécution du plugin.

**Utilisez-le pour :**

- l’identité du plugin, la validation de configuration et les indications pour l’interface de configuration
- les métadonnées d’authentification, d’onboarding et de configuration initiale (alias, activation automatique, variables d’environnement de fournisseur, choix d’authentification)
- les indications d’activation pour les surfaces du plan de contrôle
- la propriété abrégée des familles de modèles
- les instantanés statiques de propriété des capacités (`contracts`)
- les métadonnées de l’exécuteur QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration propres aux canaux, fusionnées dans le catalogue et les surfaces de validation

**Ne l’utilisez pas pour :** enregistrer le comportement d’exécution, déclarer des points d’entrée de code,
ou des métadonnées d’installation npm. Ces éléments appartiennent à votre code de plugin et à `package.json`.

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

## Exemple riche

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
| `id`                                 | Oui         | `string`                         | ID canonique du Plugin. Il s’agit de l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON en ligne pour la configuration de ce Plugin.                                                                                                                                                                            |
| `enabledByDefault`                   | Non         | `true`                           | Marque un Plugin groupé comme activé par défaut. Omettez-le, ou définissez n’importe quelle valeur différente de `true`, pour laisser le Plugin désactivé par défaut.                                                               |
| `legacyPluginIds`                    | Non         | `string[]`                       | Anciens ID qui se normalisent vers cet ID canonique du Plugin.                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | ID de fournisseurs qui doivent activer automatiquement ce Plugin lorsque l’authentification, la configuration ou les références de modèles les mentionnent.                                                                          |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de Plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                   |
| `channels`                           | Non         | `string[]`                       | ID de canaux détenus par ce Plugin. Utilisé pour la découverte et la validation de configuration.                                                                                                                                    |
| `providers`                          | Non         | `string[]`                       | ID de fournisseurs détenus par ce Plugin.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Non         | `string`                         | Chemin du module léger de découverte de fournisseur, relatif à la racine du Plugin, pour les métadonnées de catalogue de fournisseurs limitées au manifeste qui peuvent être chargées sans activer l’exécution complète du Plugin. |
| `modelSupport`                       | Non         | `object`                         | Raccourci, détenu par le manifeste, pour les métadonnées de familles de modèles utilisées afin de charger automatiquement le Plugin avant l’exécution.                                                                              |
| `modelCatalog`                       | Non         | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs détenus par ce Plugin. C’est le contrat du plan de contrôle pour la future liste en lecture seule, l’onboarding, les sélecteurs de modèles, les alias et la suppression sans charger l’exécution du Plugin. |
| `modelPricing`                       | Non         | `object`                         | Politique de recherche de tarification externe détenue par le fournisseur. Utilisez-la pour exclure les fournisseurs locaux/auto-hébergés des catalogues de tarification distants ou mapper les références de fournisseur vers des ID de catalogue OpenRouter/LiteLLM sans coder en dur les ID de fournisseur dans le cœur. |
| `modelIdNormalization`               | Non         | `object`                         | Nettoyage des alias/préfixes d’ID de modèle détenu par le fournisseur qui doit s’exécuter avant le chargement de l’exécution du fournisseur.                                                                                        |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl de point de terminaison détenues par le manifeste pour les routes de fournisseur que le cœur doit classifier avant le chargement de l’exécution du fournisseur.                                         |
| `providerRequest`                    | Non         | `object`                         | Métadonnées légères de famille de fournisseurs et de compatibilité des requêtes utilisées par la politique de requête générique avant le chargement de l’exécution du fournisseur.                                                  |
| `cliBackends`                        | Non         | `string[]`                       | ID de moteurs d’inférence CLI détenus par ce Plugin. Utilisé pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                                                |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de moteur CLI dont le hook d’authentification synthétique détenu par le Plugin doit être sondé pendant la découverte à froid des modèles avant le chargement de l’exécution.                           |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs d’espace réservé de clé d’API détenues par le Plugin groupé qui représentent un état d’identifiants local, OAuth ou ambiant non secret.                                                                                     |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes détenus par ce Plugin qui doivent produire des diagnostics de configuration et de CLI sensibles au Plugin avant le chargement de l’exécution.                                                                      |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées d’environnement de compatibilité obsolètes pour la recherche d’authentification/statut de fournisseur. Préférez `setup.providers[].envVars` pour les nouveaux Plugins ; OpenClaw lit encore ceci pendant la fenêtre de dépréciation. |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | ID de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de codage qui partage la clé d’API du fournisseur de base et les profils d’authentification. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées d’environnement légères de canal qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez ceci pour la configuration de canal pilotée par l’environnement ou les surfaces d’authentification que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des indicateurs CLI.                                                                    |
| `activation`                         | Non         | `object`                         | Métadonnées légères du planificateur d’activation pour le chargement déclenché par le démarrage, le fournisseur, la commande, le canal, la route et la capacité. Métadonnées uniquement ; l’exécution du Plugin reste propriétaire du comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger l’exécution du Plugin.                                                                            |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement de l’exécution du Plugin.                                                                                                         |
| `contracts`                          | Non         | `object`                         | Instantané statique de propriété des capacités pour les hooks d’authentification externes, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de musique, la génération de vidéos, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les ID de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                           |
| `imageGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération d’images pour les ID de fournisseurs déclarés dans `contracts.imageGenerationProviders`, y compris les alias d’authentification détenus par le fournisseur et les garde-fous de base-url. |
| `videoGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération de vidéos pour les ID de fournisseurs déclarés dans `contracts.videoGenerationProviders`, y compris les alias d’authentification détenus par le fournisseur et les garde-fous de base-url. |
| `musicGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d’authentification de génération de musique pour les ID de fournisseurs déclarés dans `contracts.musicGenerationProviders`, y compris les alias d’authentification détenus par le fournisseur et les garde-fous de base-url. |
| `toolMetadata`                       | Non         | `Record<string, object>`         | Métadonnées légères de disponibilité pour les outils détenus par le Plugin déclarés dans `contracts.tools`. Utilisez-les lorsqu’un outil ne doit pas charger l’exécution sauf s’il existe des preuves de configuration, d’environnement ou d’authentification. |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement de l’exécution.                                                                     |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                                                    |
| `name`                               | Non         | `string`                         | Nom du Plugin lisible par l’humain.                                                                                                                                                                                                |
| `description`                        | Non      | `string`                         | Bref résumé affiché dans les surfaces de Plugin.                                                                                                                                                                                    |
| `version`                            | Non      | `string`                         | Version de Plugin à titre informatif.                                                                                                                                                                                               |
| `uiHints`                            | Non      | `Record<string, object>`         | Libellés d’interface utilisateur, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                                                  |

## Référence des métadonnées de fournisseur de génération

Les champs de métadonnées de fournisseur de génération décrivent les signaux d’authentification statiques pour les
fournisseurs déclarés dans la liste `contracts.*GenerationProviders` correspondante.
OpenClaw lit ces champs avant le chargement du runtime du plugin fournisseur afin que les outils principaux puissent
déterminer si un fournisseur de génération est disponible sans importer chaque
plugin fournisseur.

Utilisez ces champs uniquement pour des faits déclaratifs peu coûteux. Le transport, les transformations de requêtes,
l’actualisation des jetons, la validation des identifiants et le comportement réel de génération
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

Chaque entrée de métadonnées prend en charge :

| Champ           | Requis | Type       | Signification                                                                                                                       |
| --------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | Non    | `string[]` | Identifiants de fournisseur supplémentaires qui doivent compter comme alias d’authentification statiques pour le fournisseur de génération. |
| `authProviders` | Non    | `string[]` | Identifiants de fournisseur dont les profils d’authentification configurés doivent compter comme authentification pour ce fournisseur de génération. |
| `configSignals` | Non    | `object[]` | Signaux de disponibilité peu coûteux, basés uniquement sur la configuration, pour les fournisseurs locaux ou auto-hébergés configurables sans profils d’authentification ni variables d’environnement. |
| `authSignals`   | Non    | `object[]` | Signaux d’authentification explicites. Lorsqu’ils sont présents, ils remplacent l’ensemble de signaux par défaut issu de l’identifiant du fournisseur, de `aliases` et de `authProviders`. |

Chaque entrée `configSignals` prend en charge :

| Champ         | Requis | Type       | Signification                                                                                                                                                                           |
| ------------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | Oui    | `string`   | Chemin par points vers l’objet de configuration appartenant au plugin à inspecter, par exemple `plugins.entries.example.config`. |
| `overlayPath` | Non    | `string`   | Chemin par points dans la configuration racine dont l’objet doit se superposer à l’objet racine avant l’évaluation du signal. Utilisez-le pour une configuration propre à une capacité, comme `image`, `video` ou `music`. |
| `required`    | Non    | `string[]` | Chemins par points dans la configuration effective qui doivent avoir des valeurs configurées. Les chaînes doivent être non vides ; les objets et tableaux ne doivent pas être vides. |
| `requiredAny` | Non    | `string[]` | Chemins par points dans la configuration effective dont au moins un doit avoir une valeur configurée. |
| `mode`        | Non    | `object`   | Garde facultatif de mode sous forme de chaîne dans la configuration effective. Utilisez-le lorsque la disponibilité basée uniquement sur la configuration ne s’applique qu’à un seul mode. |

Chaque garde `mode` prend en charge :

| Champ        | Requis | Type       | Signification                                                                      |
| ------------ | ------ | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Non    | `string`   | Chemin par points dans la configuration effective. Valeur par défaut : `mode`. |
| `default`    | Non    | `string`   | Valeur de mode à utiliser lorsque la configuration omet le chemin. |
| `allowed`    | Non    | `string[]` | S’il est présent, le signal réussit uniquement lorsque le mode effectif fait partie de ces valeurs. |
| `disallowed` | Non    | `string[]` | S’il est présent, le signal échoue lorsque le mode effectif fait partie de ces valeurs. |

Chaque entrée `authSignals` prend en charge :

| Champ             | Requis | Type     | Signification                                                                                                                                                                 |
| ----------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui    | `string` | Identifiant du fournisseur à vérifier dans les profils d’authentification configurés. |
| `providerBaseUrl` | Non    | `object` | Garde facultatif qui fait compter le signal uniquement lorsque le fournisseur configuré référencé utilise une URL de base autorisée. Utilisez-le lorsqu’un alias d’authentification n’est valide que pour certaines API. |

Chaque garde `providerBaseUrl` prend en charge :

| Champ             | Requis | Type       | Signification                                                                                                                                        |
| ----------------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui    | `string`   | Identifiant de configuration du fournisseur dont le `baseUrl` doit être vérifié. |
| `defaultBaseUrl`  | Non    | `string`   | URL de base à supposer lorsque la configuration du fournisseur omet `baseUrl`. |
| `allowedBaseUrls` | Oui    | `string[]` | URL de base autorisées pour ce signal d’authentification. Le signal est ignoré lorsque l’URL de base configurée ou par défaut ne correspond à aucune de ces valeurs normalisées. |

## Référence des métadonnées d’outil

`toolMetadata` utilise les mêmes formes `configSignals` et `authSignals` que les
métadonnées de fournisseur de génération, indexées par nom d’outil. `contracts.tools` déclare
la propriété. `toolMetadata` déclare des preuves de disponibilité peu coûteuses afin qu’OpenClaw puisse
éviter d’importer le runtime d’un plugin seulement pour que sa fabrique d’outils renvoie `null`.

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
sur chemin critique dont la fabrique dépend de l’authentification ou de la configuration, les auteurs de plugin doivent déclarer
`toolMetadata` au lieu de faire importer le runtime par le cœur pour poser la question.

## Référence providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’intégration ou d’authentification.
OpenClaw lit ceci avant le chargement du runtime du fournisseur.
Les listes de configuration de fournisseur utilisent ces choix de manifeste, les choix de configuration dérivés des descripteurs
et les métadonnées du catalogue d’installation sans charger le runtime du fournisseur.

| Champ                 | Requis | Type                                            | Signification                                                                                            |
| --------------------- | ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui    | `string`                                        | Identifiant du fournisseur auquel ce choix appartient. |
| `method`              | Oui    | `string`                                        | Identifiant de méthode d’authentification vers lequel répartir. |
| `choiceId`            | Oui    | `string`                                        | Identifiant stable de choix d’authentification utilisé par les flux d’intégration et de CLI. |
| `choiceLabel`         | Non    | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw utilise `choiceId` comme solution de repli. |
| `choiceHint`          | Non    | `string`                                        | Texte d’aide court pour le sélecteur. |
| `assistantPriority`   | Non    | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant. |
| `assistantVisibility` | Non    | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l’assistant tout en autorisant encore la sélection manuelle dans la CLI. |
| `deprecatedChoiceIds` | Non    | `string[]`                                      | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement. |
| `groupId`             | Non    | `string`                                        | Identifiant de groupe facultatif pour regrouper des choix liés. |
| `groupLabel`          | Non    | `string`                                        | Libellé visible par l’utilisateur pour ce groupe. |
| `groupHint`           | Non    | `string`                                        | Texte d’aide court pour le groupe. |
| `optionKey`           | Non    | `string`                                        | Clé d’option interne pour les flux d’authentification simples à option unique. |
| `cliFlag`             | Non    | `string`                                        | Nom du drapeau CLI, comme `--openrouter-api-key`. |
| `cliOption`           | Non    | `string`                                        | Forme complète de l’option CLI, comme `--openrouter-api-key <key>`. |
| `cliDescription`      | Non    | `string`                                        | Description utilisée dans l’aide de la CLI. |
| `onboardingScopes`    | Non    | `Array<"text-inference" \| "image-generation">` | Surfaces d’intégration dans lesquelles ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence commandAliases

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande runtime que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code runtime du plugin.

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

| Champ        | Requis | Type              | Signification                                                              |
| ------------ | ------ | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Oui    | `string`          | Nom de commande qui appartient à ce plugin.                                |
| `kind`       | Non    | `"runtime-slash"` | Marque l’alias comme une commande slash de chat plutôt qu’une commande CLI racine. |
| `cliCommand` | Non    | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, s’il en existe une.  |

## référence d’activation

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/chargement.

Ce bloc contient des métadonnées de planificateur, pas une API de cycle de vie. Il n’enregistre pas
de comportement runtime, ne remplace pas `register(...)`, et ne garantit pas que
le code du plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
réduire les plugins candidats avant de revenir aux métadonnées de propriété de manifeste existantes
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez les métadonnées les plus précises qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour des indications de planificateur
supplémentaires qui ne peuvent pas être représentées par ces champs de propriété.
Utilisez `cliBackends` de premier niveau pour les alias runtime CLI comme `claude-cli`,
`codex-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` est réservé
aux ids de harnais d’agent intégrés qui n’ont pas déjà de champ de propriété.

Ce bloc est uniquement constitué de métadonnées. Il n’enregistre pas de comportement runtime et il ne
remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée runtime/plugin.
Les consommateurs actuels l’utilisent comme indication de réduction avant un chargement de plugin plus large, donc
l’absence de métadonnées d’activation hors démarrage ne coûte généralement que des performances ; elle
ne devrait pas modifier la correction tant que les replis de propriété de manifeste existent encore.

Chaque plugin doit définir `activation.onStartup` intentionnellement. Définissez-le sur `true`
uniquement lorsque le plugin doit s’exécuter pendant le démarrage du Gateway. Définissez-le sur `false` lorsque
le plugin est inerte au démarrage et ne doit se charger qu’à partir de déclencheurs plus précis.
Omettre `onStartup` ne charge plus implicitement le plugin au démarrage ; utilisez des
métadonnées d’activation explicites pour le démarrage, les canaux, la configuration, les harnais d’agent, la mémoire ou
d’autres déclencheurs d’activation plus précis.

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

| Champ              | Requis | Type                                                 | Signification                                                                                                                                                                               |
| ------------------ | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Non    | `boolean`                                            | Activation explicite au démarrage du Gateway. Chaque plugin doit définir ce champ. `true` importe le plugin pendant le démarrage ; `false` le garde paresseux au démarrage sauf si un autre déclencheur correspondant nécessite son chargement. |
| `onProviders`      | Non    | `string[]`                                           | Ids de fournisseurs qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                                      |
| `onAgentHarnesses` | Non    | `string[]`                                           | Ids runtime de harnais d’agent intégrés qui doivent inclure ce plugin dans les plans d’activation/chargement. Utilisez `cliBackends` de premier niveau pour les alias de backends CLI.                                           |
| `onCommands`       | Non    | `string[]`                                           | Ids de commandes qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                                       |
| `onChannels`       | Non    | `string[]`                                           | Ids de canaux qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                                       |
| `onRoutes`         | Non    | `string[]`                                           | Types de routes qui doivent inclure ce plugin dans les plans d’activation/chargement.                                                                                                                       |
| `onConfigPaths`    | Non    | `string[]`                                           | Chemins de configuration relatifs à la racine qui doivent inclure ce plugin dans les plans de démarrage/chargement lorsque le chemin est présent et n’est pas explicitement désactivé.                                                      |
| `onCapabilities`   | Non    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications de capacités larges utilisées par la planification d’activation du plan de contrôle. Préférez des champs plus précis lorsque c’est possible.                                                                                     |

Consommateurs actifs actuels :

- La planification du démarrage du Gateway utilise `activation.onStartup` pour l’importation explicite au démarrage
- la planification CLI déclenchée par une commande revient à l’ancien
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification du démarrage du runtime d’agent utilise `activation.onAgentHarnesses` pour
  les harnais intégrés et `cliBackends[]` de premier niveau pour les alias runtime CLI
- la planification de configuration/canal déclenchée par un canal revient à l’ancienne propriété `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification de plugin au démarrage utilise `activation.onConfigPaths` pour les surfaces de configuration racine hors canal,
  comme le bloc `browser` du plugin navigateur groupé
- la planification de configuration/runtime déclenchée par un fournisseur revient à l’ancienne propriété
  `providers[]` et `cliBackends[]` de premier niveau lorsque les métadonnées explicites
  d’activation de fournisseur sont absentes

Les diagnostics du planificateur peuvent distinguer les indications d’activation explicites du repli de
propriété de manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` a correspondu, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces étiquettes de raison sont destinées
aux diagnostics de l’hôte et aux tests ; les auteurs de plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## référence qaRunners

Utilisez `qaRunners` lorsqu’un plugin contribue un ou plusieurs runners de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; le runtime du plugin
possède toujours l’enregistrement CLI réel via une surface légère
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

| Champ         | Requis | Type     | Signification                                                      |
| ------------- | ------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Oui    | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.    |
| `description` | Non    | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande stub. |

## référence setup

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées peu coûteuses appartenant au plugin
avant le chargement du runtime.

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

`cliBackends` de premier niveau reste valide et continue de décrire les backends d’inférence CLI.
`setup.cliBackends` est la surface de descripteur propre à la configuration pour
les flux plan de contrôle/configuration qui doivent rester uniquement basés sur des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
descriptive préférée pour la découverte de configuration. Si le descripteur ne fait que
réduire le plugin candidat et que la configuration a encore besoin de hooks runtime plus riches au moment de la configuration,
définissez `requiresRuntime: true` et gardez `setup-api` en place comme
chemin d’exécution de repli.

OpenClaw inclut aussi `setup.providers[].envVars` dans les recherches génériques d’authentification de fournisseur et
de variables d’environnement. `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
pendant la fenêtre de dépréciation, mais les plugins non groupés qui l’utilisent encore
reçoivent un diagnostic de manifeste. Les nouveaux plugins doivent placer les métadonnées d’environnement de configuration/statut
sur `setup.providers[].envVars`.

OpenClaw peut aussi dériver des choix de configuration simples depuis `setup.providers[].authMethods`
lorsqu’aucune entrée de configuration n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que le runtime de configuration est inutile. Les entrées explicites `providerAuthChoices` restent
préférées pour les libellés personnalisés, les flags CLI, le périmètre d’onboarding et les métadonnées d’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs suffisent pour la
surface de configuration. OpenClaw traite `false` explicite comme un contrat uniquement descriptif
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche de configuration. Si
un plugin uniquement descriptif fournit quand même l’une de ces entrées runtime de configuration,
OpenClaw signale un diagnostic additif et continue de l’ignorer. L’omission de
`requiresRuntime` conserve le comportement de repli hérité afin que les plugins existants qui ont ajouté
des descripteurs sans le flag ne cassent pas.

Comme la recherche de configuration peut exécuter du code `setup-api` appartenant au plugin, les valeurs normalisées
`setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi
les plugins découverts. Une propriété ambiguë échoue de manière fermée au lieu de choisir un
gagnant selon l’ordre de découverte.

Lorsque le runtime de configuration s’exécute, les diagnostics du registre de configuration signalent une dérive de descripteur
si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs de manifeste
ne déclarent pas, ou si un descripteur n’a pas d’enregistrement runtime correspondant.
Ces diagnostics sont additifs et ne rejettent pas les plugins hérités.

### référence setup.providers

| Champ          | Requis | Type       | Signification                                                                                    |
| -------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Oui    | `string`   | Id de fournisseur exposé pendant la configuration ou l’onboarding. Gardez les ids normalisés globalement uniques.             |
| `authMethods`  | Non    | `string[]` | Ids de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger le runtime complet.                       |
| `envVars`      | Non    | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement du runtime du plugin.               |
| `authEvidence` | Non    | `object[]` | Vérifications locales peu coûteuses de preuves d’authentification pour les fournisseurs qui peuvent s’authentifier via des marqueurs non secrets. |

`authEvidence` sert aux marqueurs d’identifiants locaux appartenant au fournisseur qui peuvent être
vérifiés sans charger de code d’exécution. Ces vérifications doivent rester peu coûteuses et locales :
aucun appel réseau, aucune lecture du trousseau ou d’un gestionnaire de secrets, aucune commande shell, et aucune
sonde d’API fournisseur.

Entrées de preuve prises en charge :

| Champ              | Obligatoire | Type       | Signification                                                                                                  |
| ------------------ | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Oui         | `string`   | Actuellement `local-file-with-env`.                                                                            |
| `fileEnvVar`       | Non         | `string`   | Variable d’environnement contenant un chemin explicite vers le fichier d’identifiants.                         |
| `fallbackPaths`    | Non         | `string[]` | Chemins locaux de fichiers d’identifiants vérifiés lorsque `fileEnvVar` est absent ou vide. Prend en charge `${HOME}` et `${APPDATA}`. |
| `requiresAnyEnv`   | Non         | `string[]` | Au moins une variable d’environnement listée doit être non vide pour que la preuve soit valide.                |
| `requiresAllEnv`   | Non         | `string[]` | Chaque variable d’environnement listée doit être non vide pour que la preuve soit valide.                      |
| `credentialMarker` | Oui         | `string`   | Marqueur non secret renvoyé lorsque la preuve est présente.                                                    |
| `source`           | Non         | `string`   | Libellé de source destiné à l’utilisateur pour la sortie d’authentification/de statut.                         |

### champs de setup

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de setup de fournisseur exposés pendant le setup et l’onboarding.                      |
| `cliBackends`      | Non         | `string[]` | Ids de backends utilisés au moment du setup pour la recherche setup-first par descripteur. Gardez des ids normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | Ids de migration de configuration appartenant à la surface de setup de ce plugin.                   |
| `requiresRuntime`  | Non         | `boolean`  | Indique si le setup nécessite encore l’exécution de `setup-api` après la recherche par descripteur. |

## référence uiHints

`uiHints` est une carte des noms de champs de configuration vers de petites indications de rendu.

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

| Champ         | Type       | Signification                         |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | Libellé de champ destiné à l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                   |
| `tags`        | `string[]` | Balises d’interface facultatives.     |
| `advanced`    | `boolean`  | Marque le champ comme avancé.         |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les champs de formulaire. |

## référence contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu’OpenClaw peut
lire sans importer le runtime du plugin.

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
| `embeddedExtensionFactories`     | `string[]` | Ids de fabriques d’extension du serveur d’app Codex, actuellement `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ids de runtime pour lesquels un plugin groupé peut enregistrer un middleware de résultat d’outil. |
| `externalAuthProviders`          | `string[]` | Ids de fournisseurs dont ce plugin possède le hook de profil d’authentification externe. |
| `speechProviders`                | `string[]` | Ids de fournisseurs de parole appartenant à ce plugin.                |
| `realtimeTranscriptionProviders` | `string[]` | Ids de fournisseurs de transcription en temps réel appartenant à ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ids de fournisseurs de voix en temps réel appartenant à ce plugin.    |
| `memoryEmbeddingProviders`       | `string[]` | Ids de fournisseurs d’embeddings mémoire appartenant à ce plugin.     |
| `mediaUnderstandingProviders`    | `string[]` | Ids de fournisseurs de compréhension multimédia appartenant à ce plugin. |
| `imageGenerationProviders`       | `string[]` | Ids de fournisseurs de génération d’images appartenant à ce plugin.   |
| `videoGenerationProviders`       | `string[]` | Ids de fournisseurs de génération vidéo appartenant à ce plugin.      |
| `webFetchProviders`              | `string[]` | Ids de fournisseurs de récupération web appartenant à ce plugin.      |
| `webSearchProviders`             | `string[]` | Ids de fournisseurs de recherche web appartenant à ce plugin.         |
| `migrationProviders`             | `string[]` | Ids de fournisseurs d’import appartenant à ce plugin pour `openclaw migrate`. |
| `tools`                          | `string[]` | Noms d’outils d’agent appartenant à ce plugin.                        |

`contracts.embeddedExtensionFactories` est conservé pour les fabriques d’extension groupées Codex
réservées au serveur d’app. Les transformations groupées de résultats d’outils doivent
déclarer `contracts.agentToolResultMiddleware` et s’enregistrer avec
`api.registerAgentToolResultMiddleware(...)` à la place. Les plugins externes ne peuvent pas
enregistrer de middleware de résultat d’outil, car cette jonction peut réécrire une sortie d’outil
hautement fiable avant que le modèle ne la voie.

Les enregistrements runtime `api.registerTool(...)` doivent correspondre à `contracts.tools`.
La découverte d’outils utilise cette liste pour charger uniquement les runtimes de plugins qui peuvent posséder les
outils demandés.

Les plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les plugins sans cette déclaration passent encore
par un repli de compatibilité obsolète, mais ce repli est plus lent et
sera supprimé après la fenêtre de migration.

Les fournisseurs groupés d’embeddings mémoire doivent déclarer
`contracts.memoryEmbeddingProviders` pour chaque id d’adaptateur qu’ils exposent, y compris
les adaptateurs intégrés tels que `local`. Les chemins CLI autonomes utilisent ce contrat de manifeste
pour charger uniquement le plugin propriétaire avant que le runtime Gateway complet ait
enregistré les fournisseurs.

## référence mediaUnderstandingProviderMetadata

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension multimédia a
des modèles par défaut, une priorité de repli d’auto-authentification, ou une prise en charge native des documents dont
les aides génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités multimédias exposées par ce fournisseur.                           |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus bas sont triés plus tôt pour le repli automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de documents natives prises en charge par le fournisseur.            |

## référence channelConfigs

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de configuration peu coûteuses avant le
chargement du runtime. La découverte en lecture seule du setup/statut de canal peut utiliser ces métadonnées
directement pour les canaux externes configurés lorsqu’aucune entrée de setup n’est disponible, ou
lorsque `setup.requiresRuntime: false` déclare que le runtime de setup est inutile.

`channelConfigs` est une métadonnée de manifeste de plugin, pas une nouvelle section de configuration utilisateur
de premier niveau. Les utilisateurs configurent toujours les instances de canal sous `channels.<channel-id>`.
OpenClaw lit les métadonnées de manifeste pour décider quel plugin possède ce canal configuré
avant l’exécution du code runtime du plugin.

Pour un plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les plugins non groupés qui déclarent `channels[]` doivent aussi déclarer des entrées
`channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le plugin, mais
les surfaces de schéma de configuration à froid, de setup et de Control UI ne peuvent pas connaître la
forme des options appartenant au canal avant l’exécution du runtime du plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et
`nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut statiques `auto` pour les vérifications de configuration
des commandes qui s’exécutent avant le chargement du runtime du canal. Les canaux groupés peuvent aussi publier
les mêmes valeurs par défaut via `package.json#openclaw.channel.commands` aux côtés
des autres métadonnées de catalogue de canaux appartenant à leur paquet.

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
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées d’exécution ne sont pas prêtes. |
| `description` | `string`                 | Brève description du canal pour les surfaces d’inspection et de catalogue.                               |
| `commands`    | `object`                 | Commande native statique et valeurs automatiques par défaut de compétence native pour les vérifications de configuration avant exécution.       |
| `preferOver`  | `string[]`               | Identifiants de plugins anciens ou de priorité inférieure que ce canal doit devancer dans les surfaces de sélection.    |

### Remplacer un autre plugin de canal

Utilisez `preferOver` lorsque votre plugin est le propriétaire préféré pour un identifiant de canal qu’un
autre plugin peut également fournir. Les cas courants sont un identifiant de plugin renommé, un
plugin autonome qui remplace un plugin inclus, ou un fork maintenu qui
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

Lorsque `channels.chat` est configuré, OpenClaw prend en compte à la fois l’identifiant du canal et
l’identifiant du plugin préféré. Si le plugin de priorité inférieure n’a été sélectionné que parce
qu’il est inclus ou activé par défaut, OpenClaw le désactive dans la configuration
d’exécution effective afin qu’un seul plugin possède le canal et ses outils. La sélection explicite de l’utilisateur
reste prioritaire : si l’utilisateur active explicitement les deux plugins, OpenClaw
préserve ce choix et signale des diagnostics de canal/outil en double au lieu de
modifier silencieusement l’ensemble de plugins demandé.

Gardez `preferOver` limité aux identifiants de plugins qui peuvent réellement fournir le même canal.
Ce n’est pas un champ de priorité général et il ne renomme pas les clés de configuration utilisateur.

## Référence modelSupport

Utilisez `modelSupport` lorsque OpenClaw doit déduire votre plugin fournisseur à partir
d’identifiants de modèles abrégés comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement
de l’exécution du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` du propriétaire
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un plugin non inclus et un plugin inclus correspondent tous les deux, le plugin non inclus
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants de modèles abrégés.                 |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants de modèles abrégés après suppression du suffixe de profil. |

## Référence modelCatalog

Utilisez `modelCatalog` lorsque OpenClaw doit connaître les métadonnées de modèles du fournisseur avant
de charger l’exécution du plugin. C’est la source détenue par le manifeste pour les lignes de catalogue
fixes, les alias de fournisseur, les règles de suppression et le mode de découverte. L’actualisation à l’exécution
relève toujours du code d’exécution du fournisseur, mais le manifeste indique au cœur quand l’exécution
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
| `providers`    | `Record<string, object>`                                 | Lignes de catalogue pour les identifiants de fournisseurs détenus par ce plugin. Les clés doivent aussi apparaître dans `providers` au premier niveau.       |
| `aliases`      | `Record<string, object>`                                 | Alias de fournisseur qui doivent se résoudre vers un fournisseur détenu pour la planification du catalogue ou des suppressions.              |
| `suppressions` | `object[]`                                               | Lignes de modèles provenant d’une autre source que ce plugin supprime pour une raison propre au fournisseur.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées du manifeste, actualisé dans le cache, ou nécessite l’exécution. |

`aliases` participe à la recherche de propriété du fournisseur pour la planification du catalogue de modèles.
Les cibles d’alias doivent être des fournisseurs de premier niveau détenus par le même plugin. Lorsqu’une
liste filtrée par fournisseur utilise un alias, OpenClaw peut lire le manifeste propriétaire et
appliquer les remplacements d’API/de base URL de l’alias sans charger l’exécution du fournisseur.
Les alias n’étendent pas les listes de catalogue non filtrées ; les listes larges émettent uniquement
les lignes du fournisseur canonique propriétaire.

`suppressions` remplace l’ancien hook d’exécution du fournisseur `suppressBuiltInModel`.
Les entrées de suppression ne sont honorées que lorsque le fournisseur est détenu par le plugin ou
déclaré comme clé `modelCatalog.aliases` qui cible un fournisseur détenu. Les hooks de
suppression à l’exécution ne sont plus appelés pendant la résolution du modèle.

Champs de fournisseur :

| Champ     | Type                     | Signification                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL de base par défaut facultative pour les modèles dans ce catalogue de fournisseur.    |
| `api`     | `ModelApi`               | Adaptateur d’API par défaut facultatif pour les modèles dans ce catalogue de fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques facultatifs qui s’appliquent à ce catalogue de fournisseur.      |
| `models`  | `object[]`               | Lignes de modèles requises. Les lignes sans `id` sont ignorées.            |

Champs de modèle :

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
| `contextTokens` | `number`                                                       | Limite de contexte effective facultative à l’exécution lorsqu’elle diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de tokens de sortie lorsqu’il est connu.                                           |
| `cost`          | `object`                                                       | Tarification facultative en USD par million de tokens, incluant `tieredPricing` facultatif. |
| `compat`        | `object`                                                       | Indicateurs de compatibilité facultatifs correspondant à la compatibilité de configuration de modèle OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Statut de liste. Supprimez seulement lorsque la ligne ne doit pas apparaître du tout.          |
| `statusReason`  | `string`                                                       | Raison facultative affichée avec un statut non disponible.                            |
| `replaces`      | `string[]`                                                     | Anciens identifiants de modèles locaux au fournisseur que ce modèle remplace.                       |
| `replacedBy`    | `string`                                                       | Identifiant de modèle local au fournisseur de remplacement pour les lignes obsolètes.                    |
| `tags`          | `string[]`                                                     | Tags stables utilisés par les sélecteurs et les filtres.                                    |

Champs de suppression :

| Champ                      | Type       | Signification                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identifiant du fournisseur pour la ligne amont à supprimer. Doit être détenu par ce plugin ou déclaré comme alias détenu. |
| `model`                    | `string`   | Identifiant de modèle local au fournisseur à supprimer.                                                                      |
| `reason`                   | `string`   | Message facultatif affiché lorsque la ligne supprimée est demandée directement.                                     |
| `when.baseUrlHosts`        | `string[]` | Liste facultative des hôtes d’URL de base effectifs du fournisseur requis avant que la suppression s’applique.               |
| `when.providerConfigApiIn` | `string[]` | Liste facultative des valeurs exactes `api` de configuration du fournisseur requises avant que la suppression s’applique.              |

Ne mettez pas de données uniquement disponibles à l’exécution dans `modelCatalog`. Utilisez `static` uniquement lorsque les lignes du manifeste sont suffisamment complètes pour permettre aux surfaces de liste filtrée par fournisseur et de sélecteur d’éviter la découverte via registre/runtime. Utilisez `refreshable` lorsque les lignes du manifeste sont des graines ou des compléments listables utiles, mais qu’un rafraîchissement/cache peut ajouter davantage de lignes plus tard ; les lignes refreshable ne font pas autorité à elles seules. Utilisez `runtime` quand OpenClaw doit charger le runtime du fournisseur pour connaître la liste.

## Référence modelIdNormalization

Utilisez `modelIdNormalization` pour le nettoyage peu coûteux, détenu par le fournisseur, des identifiants de modèle, qui doit se produire avant le chargement du runtime du fournisseur. Cela conserve les alias tels que les noms courts de modèles, les anciens identifiants locaux au fournisseur et les règles de préfixe de proxy dans le manifeste du Plugin propriétaire au lieu des tables principales de sélection de modèles.

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

Champs de fournisseur :

| Champ                                | Type                    | Ce que cela signifie                                                                                         |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | Alias exacts d’identifiants de modèle insensibles à la casse. Les valeurs sont renvoyées telles qu’écrites. |
| `stripPrefixes`                      | `string[]`              | Préfixes à supprimer avant la recherche d’alias, utile pour les doublons hérités fournisseur/modèle.         |
| `prefixWhenBare`                     | `string`                | Préfixe à ajouter lorsque l’identifiant de modèle normalisé ne contient pas déjà `/`.                        |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Règles conditionnelles de préfixe d’identifiant nu après recherche d’alias, indexées par `modelPrefix` et `prefix`. |

## Référence providerEndpoints

Utilisez `providerEndpoints` pour la classification des points de terminaison que la stratégie générique de requête doit connaître avant le chargement du runtime du fournisseur. Le noyau reste propriétaire de la signification de chaque `endpointClass` ; les manifestes de Plugin possèdent les métadonnées d’hôte et d’URL de base.

Champs de point de terminaison :

| Champ                          | Type       | Ce que cela signifie                                                                                                  |
| ------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de point de terminaison connue du noyau, comme `openrouter`, `moonshot-native` ou `google-vertex`.             |
| `hosts`                        | `string[]` | Noms d’hôte exacts qui correspondent à la classe de point de terminaison.                                             |
| `hostSuffixes`                 | `string[]` | Suffixes d’hôte qui correspondent à la classe de point de terminaison. Préfixez avec `.` pour une correspondance limitée aux suffixes de domaine. |
| `baseUrls`                     | `string[]` | URL de base HTTP(S) normalisées exactes qui correspondent à la classe de point de terminaison.                        |
| `googleVertexRegion`           | `string`   | Région Google Vertex statique pour les hôtes globaux exacts.                                                         |
| `googleVertexRegionHostSuffix` | `string`   | Suffixe à retirer des hôtes correspondants pour exposer le préfixe de région Google Vertex.                           |

## Référence providerRequest

Utilisez `providerRequest` pour les métadonnées peu coûteuses de compatibilité des requêtes dont la stratégie générique de requête a besoin sans charger le runtime du fournisseur. Gardez la réécriture de charge utile propre au comportement dans les hooks du runtime fournisseur ou dans les helpers partagés de familles de fournisseurs.

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

Champs de fournisseur :

| Champ                 | Type         | Ce que cela signifie                                                                                         |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `family`              | `string`     | Libellé de famille de fournisseur utilisé par les décisions génériques de compatibilité des requêtes et les diagnostics. |
| `compatibilityFamily` | `"moonshot"` | Compartiment facultatif de compatibilité de famille de fournisseur pour les helpers de requête partagés.      |
| `openAICompletions`   | `object`     | Indicateurs de requête de completions compatibles OpenAI, actuellement `supportsStreamingUsage`.              |

## Référence modelPricing

Utilisez `modelPricing` lorsqu’un fournisseur a besoin d’un comportement de tarification du plan de contrôle avant le chargement du runtime. Le cache de tarification du Gateway lit ces métadonnées sans importer le code du runtime fournisseur.

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

Champs de fournisseur :

| Champ        | Type              | Ce que cela signifie                                                                                           |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Définissez sur `false` pour les fournisseurs locaux/auto-hébergés qui ne doivent jamais récupérer les tarifs OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mappage de recherche de tarification OpenRouter. `false` désactive la recherche OpenRouter pour ce fournisseur. |
| `liteLLM`    | `false \| object` | Mappage de recherche de tarification LiteLLM. `false` désactive la recherche LiteLLM pour ce fournisseur.       |

Champs de source :

| Champ                      | Type               | Ce que cela signifie                                                                                                           |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`           | Identifiant de fournisseur du catalogue externe lorsqu’il diffère de l’identifiant de fournisseur OpenClaw, par exemple `z-ai` pour un fournisseur `zai`. |
| `passthroughProviderModel` | `boolean`          | Traitez les identifiants de modèle contenant une barre oblique comme des références fournisseur/modèle imbriquées, utile pour les fournisseurs proxy comme OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes supplémentaires d’identifiants de modèle du catalogue externe. `version-dots` essaie des identifiants de version avec points comme `claude-opus-4.6`. |

### Index des fournisseurs OpenClaw

L’Index des fournisseurs OpenClaw est une métadonnée de prévisualisation détenue par OpenClaw pour les fournisseurs dont les Plugins ne sont peut-être pas encore installés. Il ne fait pas partie d’un manifeste de Plugin. Les manifestes de Plugin restent l’autorité pour les Plugins installés. L’Index des fournisseurs est le contrat de secours interne que les futures surfaces de sélecteur de modèle pour fournisseurs installables et avant installation consommeront lorsqu’un Plugin de fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. Manifeste de Plugin installé `modelCatalog`.
3. Cache du catalogue de modèles issu d’un rafraîchissement explicite.
4. Lignes de prévisualisation de l’Index des fournisseurs OpenClaw.

L’Index des fournisseurs ne doit pas contenir de secrets, d’état activé, de hooks runtime ni de données de modèle propres à un compte en direct. Ses catalogues de prévisualisation utilisent la même forme de ligne de fournisseur `modelCatalog` que les manifestes de Plugin, mais doivent rester limités aux métadonnées d’affichage stables, sauf si des champs d’adaptateur runtime tels que `api`, `baseUrl`, la tarification ou les indicateurs de compatibilité sont intentionnellement maintenus alignés avec le manifeste de Plugin installé. Les fournisseurs avec découverte `/models` en direct doivent écrire les lignes rafraîchies via le chemin explicite du cache de catalogue de modèles au lieu de faire appeler les API fournisseur par la liste normale ou l’intégration initiale.

Les entrées de l’Index des fournisseurs peuvent aussi porter des métadonnées de Plugin installable pour les fournisseurs dont le Plugin a quitté le noyau ou n’est pas encore installé autrement. Ces métadonnées reflètent le modèle du catalogue de canaux : le nom du paquet, la spécification d’installation npm, l’intégrité attendue et des libellés peu coûteux de choix d’authentification suffisent pour afficher une option de configuration installable. Une fois le Plugin installé, son manifeste l’emporte et l’entrée de l’Index des fournisseurs est ignorée pour ce fournisseur.

Les anciennes clés de capacité de premier niveau sont obsolètes. Utilisez `openclaw doctor --fix` pour déplacer `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal des manifestes ne traite plus ces champs de premier niveau comme une propriété de capacité.

## Manifeste versus package.json

Les deux fichiers remplissent des rôles différents :

| Fichier                | À utiliser pour                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’interface qui doivent exister avant l’exécution du code du Plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le filtrage d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du Plugin, mettez-la dans `openclaw.plugin.json`
- si elle concerne l’empaquetage, les fichiers d’entrée ou le comportement d’installation npm, mettez-la dans `package.json`

### Champs package.json qui affectent la découverte

Certaines métadonnées de Plugin avant runtime vivent intentionnellement dans `package.json` sous le bloc `openclaw` au lieu de `openclaw.plugin.json`.
`openclaw.bundle` et `openclaw.bundle.json` ne sont pas des contrats de Plugin OpenClaw ; les Plugins natifs doivent utiliser `openclaw.plugin.json` plus les champs `package.json#openclaw` pris en charge ci-dessous.

Exemples importants :

| Champ                                                                                      | Ce que cela signifie                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | Déclare les points d’entrée Plugin natifs. Doit rester dans le répertoire du package Plugin.                                                                                                                         |
| `openclaw.runtimeExtensions`                                                               | Déclare les points d’entrée d’exécution JavaScript compilés pour les packages installés. Doit rester dans le répertoire du package Plugin.                                                                          |
| `openclaw.setupEntry`                                                                      | Point d’entrée léger réservé à la configuration, utilisé pendant l’onboarding, le démarrage différé des canaux et la découverte en lecture seule de l’état du canal/des SecretRef. Doit rester dans le répertoire du package Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Nécessite `setupEntry`, doit exister et doit rester dans le répertoire du package Plugin.                                |
| `openclaw.channel`                                                                         | Métadonnées peu coûteuses du catalogue de canaux, comme les libellés, les chemins de documentation, les alias et le texte de sélection.                                                                              |
| `openclaw.channel.commands`                                                                | Métadonnées statiques de commande native et de valeur par défaut automatique des Skills natives, utilisées par la configuration, l’audit et les surfaces de liste de commandes avant le chargement de l’exécution du canal. |
| `openclaw.channel.configuredState`                                                         | Métadonnées légères de vérification de l’état configuré, capables de répondre à « une configuration uniquement via l’environnement existe-t-elle déjà ? » sans charger l’exécution complète du canal.                |
| `openclaw.channel.persistedAuthState`                                                      | Métadonnées légères de vérification de l’authentification persistée, capables de répondre à « quelque chose est-il déjà connecté ? » sans charger l’exécution complète du canal.                                    |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indices d’installation/mise à jour pour les Plugins intégrés et publiés en externe.                                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                                                             |
| `openclaw.install.minHostVersion`                                                          | Version minimale prise en charge de l’hôte OpenClaw, avec un plancher semver comme `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                                            |
| `openclaw.install.expectedIntegrity`                                                       | Chaîne d’intégrité npm dist attendue, comme `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à celle-ci.                                                          |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Autorise un chemin étroit de récupération par réinstallation de Plugin intégré lorsque la configuration est invalide.                                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permet aux surfaces de canal réservées à la configuration de se charger avant le Plugin de canal complet pendant le démarrage.                                                                                       |

Les métadonnées de manifeste décident quels choix de fournisseur/canal/configuration apparaissent dans
l’onboarding avant le chargement de l’exécution. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce Plugin lorsque l’utilisateur choisit l’une de ces
options. Ne déplacez pas les indices d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre
de manifestes pour les sources de Plugins non intégrées. Les valeurs invalides sont rejetées ;
les valeurs plus récentes mais valides ignorent les Plugins externes sur les hôtes plus anciens.
Les Plugins source intégrés sont supposés être co-versionnés avec le checkout hôte.

Les métadonnées officielles d’installation à la demande doivent utiliser `clawhubSpec` lorsque le Plugin est
publié sur ClawHub ; l’onboarding traite cela comme la source distante préférée et
enregistre les faits d’artefact ClawHub après l’installation. `npmSpec` reste la solution de compatibilité
de repli pour les packages qui n’ont pas encore migré vers ClawHub.

L’épinglage de version npm exacte se trouve déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles de catalogue externe
doivent associer les spécifications exactes à `expectedIntegrity` afin que les flux de mise à jour échouent
de façon fermée si l’artefact npm récupéré ne correspond plus à la version épinglée.
L’onboarding interactif propose toujours des spécifications npm de registre de confiance, notamment les noms
de packages nus et les dist-tags, pour compatibilité. Les diagnostics de catalogue peuvent
distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec
incompatibilité de nom de package, et à choix par défaut invalide. Ils avertissent aussi lorsque
`expectedIntegrity` est présent mais qu’aucune source npm valide ne peut être épinglée.
Lorsque `expectedIntegrity` est présent,
les flux d’installation/mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est
enregistrée sans épingle d’intégrité.

Les Plugins de canal doivent fournir `openclaw.setupEntry` lorsque les analyses d’état, de liste de canaux
ou de SecretRef doivent identifier les comptes configurés sans charger l’exécution complète.
L’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs de configuration,
d’état et de secrets sûrs pour la configuration ; gardez les clients réseau, les écouteurs Gateway et
les exécutions de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée d’exécution ne remplacent pas les vérifications de limite de package pour les champs
de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un chemin
`openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il ne rend pas
installables les configurations arbitrairement cassées. Aujourd’hui, il permet seulement aux flux d’installation
de récupérer après des échecs spécifiques de mise à niveau de Plugins intégrés obsolètes, comme un
chemin de Plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même
Plugin intégré. Les erreurs de configuration sans rapport bloquent toujours l’installation et renvoient les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un petit module
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

Utilisez-le lorsque les flux de configuration, Doctor, d’état ou de présence en lecture seule ont besoin d’une sonde
d’authentification oui/non peu coûteuse avant le chargement du Plugin de canal complet. L’état d’authentification persisté n’est
pas l’état de canal configuré : n’utilisez pas ces métadonnées pour activer automatiquement des Plugins,
réparer les dépendances d’exécution ou décider si une exécution de canal doit se charger.
L’export cible doit être une petite fonction qui lit uniquement l’état persisté ; ne le
faites pas passer par le barrel d’exécution complet du canal.

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

Utilisez-le lorsqu’un canal peut répondre à l’état configuré à partir de l’environnement ou d’autres petites
entrées hors exécution. Si la vérification nécessite une résolution complète de la configuration ou la véritable
exécution du canal, conservez cette logique dans le hook `config.hasConfiguredState`
du Plugin.

## Priorité de découverte (identifiants de Plugin en double)

OpenClaw découvre les Plugins depuis plusieurs racines (intégrée, installation globale, espace de travail, chemins explicites sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifeste à la **priorité la plus élevée** est conservé ; les doublons de priorité inférieure sont supprimés au lieu d’être chargés à côté.

Priorité, de la plus élevée à la plus basse :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Intégré** — Plugins livrés avec OpenClaw
3. **Installation globale** — Plugins installés dans la racine globale des Plugins OpenClaw
4. **Espace de travail** — Plugins découverts relativement à l’espace de travail actuel

Implications :

- Une copie forkée ou obsolète d’un Plugin intégré située dans l’espace de travail ne masquera pas la version intégrée.
- Pour remplacer réellement un Plugin intégré par un Plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il l’emporte par priorité plutôt que de dépendre de la découverte de l’espace de travail.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.
- Les remplacements de doublons sélectionnés par la configuration sont formulés comme des remplacements explicites dans les diagnostics, mais avertissent tout de même afin que les forks obsolètes et les masquages accidentels restent visibles.

## Exigences de JSON Schema

- **Chaque Plugin doit livrer un JSON Schema**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.
- Lorsque vous étendez ou forkez un Plugin intégré avec de nouvelles clés de configuration, mettez à jour le `configSchema` du `openclaw.plugin.json` de ce Plugin en même temps. Les schémas des Plugins intégrés sont stricts, donc ajouter `plugins.entries.<id>.config.myNewKey` dans la configuration utilisateur sans ajouter `myNewKey` à `configSchema.properties` sera rejeté avant le chargement de l’exécution du Plugin.

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

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’identifiant de canal est déclaré par
  un manifeste de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des identifiants de Plugins **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor et les journaux.

Consultez la [référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Notes

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local. Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les clés non citées sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez les clés personnalisées de premier niveau.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerDiscoveryEntry` doit rester léger et ne doit pas importer de code runtime étendu ; utilisez-le pour les métadonnées statiques du catalogue de fournisseurs ou des descripteurs de découverte ciblés, pas pour l’exécution au moment des requêtes.
- Les types de plugins exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (`legacy` par défaut).
- Déclarez le type de plugin exclusif dans ce manifeste. `OpenClawPluginDefinition.kind` dans l’entrée runtime est obsolète et ne reste disponible que comme solution de compatibilité pour les anciens plugins.
- Les métadonnées de variables d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` obsolète et `channelEnvVars`) sont uniquement déclaratives. L’état, l’audit, la validation de livraison cron et les autres surfaces en lecture seule appliquent toujours la confiance du plugin et la politique d’activation effective avant de considérer qu’une variable d’environnement est configurée.
- Pour les métadonnées de l’assistant runtime qui nécessitent du code fournisseur, consultez [les hooks runtime des fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Connexe

<CardGroup cols={3}>
  <Card title="Building plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Bien démarrer avec les plugins.
  </Card>
  <Card title="Plugin architecture" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="SDK overview" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK Plugin et imports de sous-chemins.
  </Card>
</CardGroup>
