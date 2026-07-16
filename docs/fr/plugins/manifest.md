---
read_when:
    - Vous développez un plugin OpenClaw
    - Vous devez publier un schéma de configuration de Plugin ou déboguer les erreurs de validation de Plugin
summary: Exigences relatives au manifeste du Plugin et au schéma JSON (validation stricte de la configuration)
title: Manifeste du Plugin
x-i18n:
    generated_at: "2026-07-16T13:29:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

Cette page décrit le **manifeste Plugin natif d’OpenClaw**, `openclaw.plugin.json`. Pour connaître les structures de bundles compatibles (Codex, Claude, Cursor), consultez [Bundles de Plugins](/fr/plugins/bundles).

Les formats de bundles compatibles utilisent plutôt leurs propres fichiers de manifeste :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json`, ou la structure par défaut des composants Claude sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement ces structures, mais ne les valide pas par rapport au schéma `openclaw.plugin.json` ci-dessous. Pour un bundle compatible, OpenClaw lit les métadonnées du bundle, les racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut de `settings.json` de Claude, les valeurs par défaut du LSP Claude et les packs de hooks pris en charge, lorsque la structure correspond aux attentes d’exécution d’OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir `openclaw.plugin.json` à la **racine du Plugin**. OpenClaw le lit afin de valider la configuration **sans exécuter le code du Plugin**. Un manifeste manquant ou non valide bloque la validation de la configuration et est traité comme une erreur de Plugin.

Consultez [Plugins](/fr/tools/plugin) pour le guide complet du système de Plugins et [Modèle de capacités](/fr/plugins/architecture#public-capability-model) pour le modèle de capacités natif et les recommandations actuelles relatives à la compatibilité externe.

## Rôle de ce fichier

`openclaw.plugin.json` contient des métadonnées qu’OpenClaw lit **avant de charger le code de votre Plugin**. Tout son contenu doit être suffisamment peu coûteux à inspecter sans démarrer l’environnement d’exécution du Plugin.

**Utilisez-le pour :**

- l’identité du Plugin, la validation de la configuration et les indications de l’interface de configuration
- les métadonnées d’authentification, d’intégration initiale et de configuration (alias, activation automatique, variables d’environnement du fournisseur, choix d’authentification)
- les indications d’activation pour les surfaces du plan de contrôle
- l’attribution abrégée des familles de modèles
- les instantanés statiques d’attribution des capacités (`contracts`)
- les métadonnées de l’exécuteur QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration propres aux canaux, fusionnées dans les surfaces de catalogue et de validation

**Ne l’utilisez pas pour :** enregistrer un comportement d’exécution, déclarer des points d’entrée de code ou définir les métadonnées d’installation npm. Ces éléments doivent figurer dans le code de votre Plugin et dans `package.json`.

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| Champ                                | Obligatoire | Type                         | Signification                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui      | `string`                     | Identifiant canonique du plugin. Il s’agit de l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                                                                                                        |
| `configSchema`                       | Oui      | `object`                     | Schéma JSON intégré pour la configuration de ce plugin.                                                                                                                                                                                                                               |
| `requiresPlugins`                    | Non       | `string[]`                   | Identifiants des plugins qui doivent également être installés pour que ce plugin produise un effet. La découverte permet le chargement du plugin, mais émet un avertissement si un plugin requis est manquant.                                                                                                               |
| `enabledByDefault`                   | Non       | `true`                       | Indique qu’un plugin intégré est activé par défaut. Omettez cette valeur, ou définissez-la sur une valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | Non       | `string[]`                   | Indique qu’un plugin intégré est activé par défaut uniquement sur les plateformes Node.js répertoriées, par exemple `["darwin"]`. La configuration explicite reste prioritaire.                                                                                                                                   |
| `legacyPluginIds`                    | Non       | `string[]`                   | Identifiants hérités qui sont normalisés vers cet identifiant canonique de plugin.                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | Non       | `string[]`                   | Identifiants de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou les références de modèles les mentionnent.                                                                                                                                                                            |
| `kind`                               | Non       | `PluginKind \| PluginKind[]` | Déclare un ou plusieurs types exclusifs de plugins (`"memory"`, `"context-engine"`) utilisés par `plugins.slots.*`. Un plugin qui possède les deux emplacements déclare les deux types dans un même tableau.                                                                                                    |
| `channels`                           | Non       | `string[]`                   | Identifiants de canaux appartenant à ce plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                                                                                                                |
| `providers`                          | Non       | `string[]`                   | Identifiants de fournisseurs appartenant à ce plugin.                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | Non       | `string`                     | Chemin du module léger du catalogue de fournisseurs, relatif à la racine du plugin, pour les métadonnées du catalogue de fournisseurs limitées au manifeste qui peuvent être chargées sans activer l’intégralité de l’environnement d’exécution du plugin.                                                                                        |
| `modelSupport`                       | Non       | `object`                     | Métadonnées abrégées des familles de modèles, détenues par le manifeste et utilisées pour charger automatiquement le plugin avant l’exécution.                                                                                                                                                                                |
| `modelCatalog`                       | Non       | `object`                     | Métadonnées déclaratives du catalogue de modèles pour les fournisseurs appartenant à ce plugin. Il s’agit du contrat du plan de contrôle pour les futures listes en lecture seule, l’intégration initiale, les sélecteurs de modèles, les alias et la suppression sans charger l’environnement d’exécution du plugin.                                                |
| `modelPricing`                       | Non       | `object`                     | Politique de consultation des tarifs externes appartenant au fournisseur. Utilisez-la pour exclure les fournisseurs locaux ou auto-hébergés des catalogues de tarifs distants, ou pour associer les références de fournisseurs aux identifiants des catalogues OpenRouter/LiteLLM sans coder en dur les identifiants de fournisseurs dans le cœur.                                                    |
| `modelIdNormalization`               | Non       | `object`                     | Nettoyage des alias ou préfixes d’identifiants de modèles appartenant au fournisseur, qui doit s’exécuter avant le chargement de l’environnement d’exécution du fournisseur.                                                                                                                                                                                  |
| `providerEndpoints`                  | Non       | `object[]`                   | Métadonnées d’hôte de point de terminaison ou de baseUrl détenues par le manifeste pour les routes de fournisseurs que le cœur doit classifier avant le chargement de l’environnement d’exécution du fournisseur.                                                                                                                                                   |
| `providerRequest`                    | Non       | `object`                     | Métadonnées légères sur la famille de fournisseurs et la compatibilité des requêtes, utilisées par la politique générique de requêtes avant le chargement de l’environnement d’exécution du fournisseur.                                                                                                                                                     |
| `secretProviderIntegrations`         | Non       | `Record<string, object>`     | Préréglages déclaratifs de fournisseurs d’exécution SecretRef que les interfaces de configuration ou d’installation peuvent proposer sans coder en dur les intégrations propres aux fournisseurs dans le cœur.                                                                                                                            |
| `cliBackends`                        | Non       | `string[]`                   | Identifiants des moteurs d’inférence CLI appartenant à ce plugin. Utilisés pour l’activation automatique au démarrage à partir de références de configuration explicites.                                                                                                                                                                |
| `syntheticAuthRefs`                  | Non       | `string[]`                   | Références de fournisseur ou de moteur CLI dont le hook d’authentification synthétique appartenant au plugin doit être sondé pendant la découverte à froid des modèles, avant le chargement de l’environnement d’exécution.                                                                                                                                     |
| `nonSecretAuthMarkers`               | Non       | `string[]`                   | Valeurs d’espace réservé de clés API, appartenant au plugin intégré, qui représentent un état d’identifiants de connexion non secret local, OAuth ou ambiant.                                                                                                                                                       |
| `commandAliases`                     | Non       | `object[]`                   | Noms de commandes appartenant à ce plugin qui doivent produire des diagnostics de configuration et de CLI tenant compte du plugin avant le chargement de l’environnement d’exécution.                                                                                                                                                       |
| `providerAuthEnvVars`                | Non       | `Record<string, string[]>`   | Métadonnées d’environnement de compatibilité obsolètes pour la recherche de l’authentification ou de l’état du fournisseur. Préférez `setup.providers[].envVars` pour les nouveaux plugins ; OpenClaw continue de les lire pendant la période d’obsolescence.                                                                                        |
| `providerUsageAuthEnvVars`           | Non       | `Record<string, string[]>`   | Identifiants de connexion du fournisseur destinés uniquement à l’utilisation et à la facturation. OpenClaw utilise ces noms pour la découverte de l’utilisation et le nettoyage des secrets, mais jamais pour l’authentification d’inférence.                                                                                                                                  |
| `providerAuthAliases`                | Non       | `Record<string, string>`     | Identifiants de fournisseurs qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de programmation qui partage la clé API et les profils d’authentification du fournisseur de base.                                                                                                                 |
| `channelEnvVars`                     | Non       | `Record<string, string[]>`   | Métadonnées légères d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du plugin. Utilisez-les pour la configuration de canal pilotée par l’environnement ou les interfaces d’authentification que les outils génériques de démarrage ou de configuration doivent détecter.                                                                                   |
| `providerAuthChoices`                | Non       | `object[]`                   | Métadonnées légères de choix d’authentification pour les sélecteurs d’intégration initiale, la résolution du fournisseur préféré et le raccordement simple des options de CLI.                                                                                                                                                              |
| `activation`                         | Non       | `object`                     | Métadonnées légères du planificateur d’activation pour le chargement déclenché par le démarrage, un fournisseur, une commande, un canal, une route ou une capacité. Métadonnées uniquement ; l’environnement d’exécution du plugin reste responsable du comportement réel.                                                                                              |
| `setup`                              | Non       | `object`                     | Descripteurs légers de configuration et d’intégration initiale que les interfaces de découverte et de configuration peuvent inspecter sans charger l’environnement d’exécution du plugin.                                                                                                                                                           |
| `qaRunners`                          | Non       | `object[]`                   | Descripteurs légers de l’exécuteur d’assurance qualité utilisés par l’hôte partagé `openclaw qa` avant le chargement de l’environnement d’exécution du plugin.                                                                                                                                                                             |
| `contracts`                          | Non       | `object`                     | Instantané statique de la propriété des capacités pour les hooks d’authentification externes, les plongements vectoriels, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, de vidéos et de musique, la récupération Web, la recherche Web, les fournisseurs de workers, l’extraction de documents et de contenu Web, ainsi que la propriété des outils. |
| `configContracts`                    | Non       | `object`                     | Comportement de configuration détenu par le manifeste et utilisé par les assistants génériques du cœur : détection des indicateurs dangereux, cibles de migration SecretRef et restriction des anciens chemins de configuration. Consultez la [référence configContracts](#configcontracts-reference).                                                     |
| `mediaUnderstandingProviderMetadata` | Non       | `Record<string, object>`     | Valeurs par défaut peu coûteuses pour la compréhension des médias, destinées aux identifiants de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | Non       | `Record<string, object>`     | Métadonnées d’authentification peu coûteuses pour la génération d’images, destinées aux identifiants de fournisseurs déclarés dans `contracts.imageGenerationProviders`, notamment les alias d’authentification détenus par les fournisseurs et les protections relatives à l’URL de base.                                                                                                         |
| `videoGenerationProviderMetadata`    | Non       | `Record<string, object>`     | Métadonnées d’authentification peu coûteuses pour la génération de vidéos, destinées aux identifiants de fournisseurs déclarés dans `contracts.videoGenerationProviders`, notamment les alias d’authentification détenus par les fournisseurs et les protections relatives à l’URL de base.                                                                                                         |
| `musicGenerationProviderMetadata`    | Non       | `Record<string, object>`     | Métadonnées d’authentification peu coûteuses pour la génération de musique, destinées aux identifiants de fournisseurs déclarés dans `contracts.musicGenerationProviders`, notamment les alias d’authentification détenus par les fournisseurs et les protections relatives à l’URL de base.                                                                                                         |
| `toolMetadata`                       | Non       | `Record<string, object>`     | Métadonnées de disponibilité peu coûteuses pour les outils détenus par des plugins et déclarés dans `contracts.tools`. Utilisez-les lorsqu’un outil ne doit pas charger l’environnement d’exécution en l’absence d’éléments de configuration, d’environnement ou d’authentification.                                                                                                  |
| `channelConfigs`                     | Non       | `Record<string, object>`     | Métadonnées de configuration de canal détenues par le manifeste et fusionnées dans les surfaces de découverte et de validation avant le chargement de l’environnement d’exécution.                                                                                                                                                                 |
| `skills`                             | Non       | `string[]`                   | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                                                                                                    |
| `name`                               | Non       | `string`                     | Nom lisible du plugin.                                                                                                                                                                                                                                                |
| `description`                        | Non       | `string`                     | Bref résumé affiché dans les surfaces du plugin.                                                                                                                                                                                                                                    |
| `catalog`                            | Non       | `object`                     | Indications de présentation facultatives pour les surfaces du catalogue de plugins. Ces métadonnées n’installent ni n’activent un plugin et ne lui accordent aucune confiance.                                                                                                                                               |
| `icon`                               | Non       | `string`                     | URL HTTPS de l’image pour les cartes de la place de marché ou du catalogue. ClawHub accepte toute URL `https://` valide et utilise par défaut l’icône du plugin lorsque cette valeur est omise ou non valide.                                                                                                         |
| `version`                            | Non       | `string`                     | Version informative du plugin.                                                                                                                                                                                                                                              |
| `uiHints`                            | Non       | `Record<string, object>`     | Libellés d’interface utilisateur, textes indicatifs et indications de sensibilité pour les champs de configuration.                                                                                                                                                                                                          |

## référence du catalogue

`catalog` fournit des indications d’affichage facultatives aux navigateurs de plugins. Les hôtes peuvent ignorer ces indications. Elles n’installent ni n’activent jamais le plugin et ne modifient ni son comportement à l’exécution ni son niveau de confiance.

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| Champ      | Type      | Signification                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | Indique si les interfaces du catalogue doivent mettre ce plugin en avant.                       |
| `order`    | `number`  | Indication d’ordre d’affichage croissant parmi les plugins sélectionnés ; les valeurs inférieures apparaissent plus tôt. |

## Référence des métadonnées des fournisseurs de génération

Les champs de métadonnées des fournisseurs de génération décrivent les signaux d’authentification statiques des fournisseurs déclarés dans la liste `contracts.*GenerationProviders` correspondante. OpenClaw lit ces champs avant le chargement de l’environnement d’exécution du fournisseur afin que les outils principaux puissent déterminer si un fournisseur de génération est disponible sans importer chaque plugin de fournisseur.

Utilisez ces champs uniquement pour des faits déclaratifs peu coûteux à évaluer. Le transport, les transformations des requêtes, l’actualisation des jetons, la validation des identifiants et le comportement effectif de génération restent dans l’environnement d’exécution du plugin.

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

Chaque entrée de métadonnées prend en charge les éléments suivants :

| Champ                  | Obligatoire | Type       | Signification                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Non       | `string[]` | Identifiants de fournisseur supplémentaires qui doivent être considérés comme des alias d’authentification statiques pour le fournisseur de génération.                                                       |
| `authProviders`        | Non       | `string[]` | Identifiants de fournisseur dont les profils d’authentification configurés doivent être considérés comme une authentification pour ce fournisseur de génération.                                                      |
| `configSignals`        | Non       | `object[]` | Signaux de disponibilité peu coûteux, fondés uniquement sur la configuration, pour les fournisseurs locaux ou auto-hébergés pouvant être configurés sans profils d’authentification ni variables d’environnement.                 |
| `authSignals`          | Non       | `object[]` | Signaux d’authentification explicites. Lorsqu’ils sont présents, ils remplacent l’ensemble de signaux par défaut provenant de l’identifiant du fournisseur, de `aliases` et de `authProviders`.                     |
| `referenceAudioInputs` | Non       | `boolean`  | Génération vidéo uniquement. Définissez sur `true` lorsque le fournisseur accepte des ressources audio de référence ; sinon, `video_generate` masque les paramètres de référence audio. |

Chaque entrée `configSignals` prend en charge les éléments suivants :

| Champ            | Obligatoire | Type       | Signification                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Oui      | `string`   | Chemin à points vers l’objet de configuration appartenant au plugin à inspecter, par exemple `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | Non       | `string`   | Chemin à points dans la configuration racine dont l’objet doit être superposé à l’objet racine avant l’évaluation du signal. Utilisez-le pour une configuration propre à une fonctionnalité, telle que `image`, `video` ou `music`.   |
| `overlayMapPath` | Non       | `string`   | Chemin à points dans la configuration racine dont chaque valeur d’objet doit être superposée à l’objet racine. Utilisez-le pour les tables de comptes nommés telles que `accounts`, où tout compte configuré doit être admissible. |
| `required`       | Non       | `string[]` | Chemins à points dans la configuration effective qui doivent contenir des valeurs configurées. Les chaînes ne doivent pas être vides ; les objets et les tableaux ne doivent pas être vides.                                                  |
| `requiredAny`    | Non       | `string[]` | Chemins à points dans la configuration effective dont au moins un doit contenir une valeur configurée.                                                                                                    |
| `mode`           | Non       | `object`   | Condition facultative sur le mode sous forme de chaîne dans la configuration effective. Utilisez-la lorsque la disponibilité fondée uniquement sur la configuration ne s’applique qu’à un seul mode.                                                                  |

Chaque condition `mode` prend en charge les éléments suivants :

| Champ        | Obligatoire | Type       | Signification                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Non       | `string`   | Chemin à points dans la configuration effective. La valeur par défaut est `mode`.                          |
| `default`    | Non       | `string`   | Valeur de mode à utiliser lorsque le chemin est omis dans la configuration.                                  |
| `allowed`    | Non       | `string[]` | Si ce champ est présent, le signal n’est validé que lorsque le mode effectif correspond à l’une de ces valeurs. |
| `disallowed` | Non       | `string[]` | Si ce champ est présent, le signal échoue lorsque le mode effectif correspond à l’une de ces valeurs.       |

Chaque entrée `authSignals` prend en charge les éléments suivants :

| Champ             | Obligatoire | Type     | Signification                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui      | `string` | Identifiant du fournisseur à rechercher dans les profils d’authentification configurés.                                                                                                                             |
| `providerBaseUrl` | Non       | `object` | Condition facultative qui ne comptabilise le signal que lorsque le fournisseur configuré référencé utilise une URL de base autorisée. Utilisez-la lorsqu’un alias d’authentification n’est valide que pour certaines API. |

Chaque condition `providerBaseUrl` prend en charge les éléments suivants :

| Champ             | Obligatoire | Type       | Signification                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui      | `string`   | Identifiant de configuration du fournisseur dont la valeur `baseUrl` doit être vérifiée.                                                                                                |
| `defaultBaseUrl`  | Non       | `string`   | URL de base à utiliser lorsque la valeur `baseUrl` est omise dans la configuration du fournisseur.                                                                                         |
| `allowedBaseUrls` | Oui      | `string[]` | URL de base autorisées pour ce signal d’authentification. Le signal est ignoré lorsque l’URL de base configurée ou par défaut ne correspond à aucune de ces valeurs normalisées. |

## Référence des métadonnées des outils

`toolMetadata` utilise les mêmes structures `configSignals` et `authSignals` que les métadonnées des fournisseurs de génération, indexées par nom d’outil. `contracts.tools` déclare la propriété. `toolMetadata` déclare une preuve de disponibilité peu coûteuse afin qu’OpenClaw puisse éviter d’importer l’environnement d’exécution d’un plugin uniquement pour que sa fabrique d’outils renvoie `null`.

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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

Les entrées `toolMetadata` acceptent également `optional` (indique que l’outil n’est pas obligatoire pour l’activation du plugin) et `replaySafe` (indique que l’exécution de l’outil peut être répétée sans risque après un tour de modèle incomplet), en plus des champs partagés `configSignals`/`authSignals` ci-dessus.

Si un outil ne possède pas de `toolMetadata`, OpenClaw conserve le comportement existant et charge le plugin propriétaire lorsque le contrat de l’outil correspond à la politique. Pour les outils situés sur des chemins critiques dont la fabrique dépend de l’authentification ou de la configuration, les auteurs de plugins doivent déclarer `toolMetadata` au lieu de contraindre le cœur à importer l’environnement d’exécution pour l’interroger.

## Référence de providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’intégration initiale ou d’authentification. OpenClaw la lit avant le chargement de l’environnement d’exécution du fournisseur. Les listes de configuration des fournisseurs utilisent ces choix du manifeste, les choix de configuration dérivés des descripteurs et les métadonnées du catalogue d’installation sans charger l’environnement d’exécution du fournisseur.

| Champ                 | Obligatoire | Type                                                                  | Signification                                                                                             |
| --------------------- | ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                                              | Identifiant du fournisseur auquel ce choix appartient.                                                    |
| `method`              | Oui         | `string`                                                              | Identifiant de la méthode d’authentification vers laquelle effectuer la répartition.                      |
| `choiceId`            | Oui         | `string`                                                              | Identifiant stable du choix d’authentification utilisé par les flux d’intégration et de la CLI.           |
| `choiceLabel`         | Non         | `string`                                                              | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw utilise `choiceId` par défaut.            |
| `choiceHint`          | Non         | `string`                                                              | Court texte d’aide pour le sélecteur.                                                                     |
| `assistantPriority`   | Non         | `number`                                                              | Les valeurs les plus faibles apparaissent plus tôt dans les sélecteurs interactifs pilotés par l’assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                                        | Masque le choix dans les sélecteurs de l’assistant tout en autorisant sa sélection manuelle dans la CLI. |
| `deprecatedChoiceIds` | Non         | `string[]`                                                            | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement.      |
| `groupId`             | Non         | `string`                                                              | Identifiant de groupe facultatif permettant de regrouper les choix associés.                              |
| `groupLabel`          | Non         | `string`                                                              | Libellé destiné à l’utilisateur pour ce groupe.                                                           |
| `groupHint`           | Non         | `string`                                                              | Court texte d’aide pour le groupe.                                                                        |
| `onboardingFeatured`  | Non         | `boolean`                                                             | Affiche ce groupe dans le niveau mis en avant du sélecteur d’intégration interactif, avant l’entrée « More... ». |
| `optionKey`           | Non         | `string`                                                              | Clé d’option interne pour les flux d’authentification simples à un seul indicateur.                       |
| `cliFlag`             | Non         | `string`                                                              | Nom de l’option de la CLI, tel que `--openrouter-api-key`.                                                    |
| `cliOption`           | Non         | `string`                                                              | Forme complète de l’option de la CLI, telle que `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Non         | `string`                                                              | Description utilisée dans l’aide de la CLI.                                                               |
| `appGuidedSecret`     | Non         | `boolean`                                                             | Un secret collé, accompagné des valeurs par défaut du fournisseur, suffit à la configuration guidée par l’application. |
| `appGuidedDiscovery`  | Non         | `boolean`                                                             | La méthode d’authentification d’exécution correspondante possède la découverte locale en lecture seule via `appGuidedSetup`. |
| `appGuidedAuth`       | Non         | `"oauth"` \| `"device-code"`                                          | Connexion interactive gérée par le fournisseur que les clients de configuration natifs peuvent afficher de manière générique. |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Sur quelles interfaces d’intégration ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

Lorsque `appGuidedDiscovery` vaut true, la méthode d’authentification correspondante du fournisseur doit exposer
`appGuidedSetup.detect` et `appGuidedSetup.prepare`. La détection doit être
en lecture seule : aucune connexion, récupération de modèle, aucun téléchargement ni aucune écriture de configuration. La préparation vérifie à nouveau
le modèle exact sélectionné et renvoie une proposition de configuration ; OpenClaw teste cette
proposition en direct de manière isolée et ne la valide qu’après sa réussite.

## Référence de commandAliases

Utilisez `commandAliases` lorsqu’un Plugin possède un nom de commande d’exécution que les utilisateurs risquent de placer par erreur dans `plugins.allow` ou de tenter d’exécuter comme commande racine de la CLI. OpenClaw utilise ces métadonnées pour les diagnostics sans importer le code d’exécution du Plugin.

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
| `name`       | Oui         | `string`          | Nom de commande appartenant à ce Plugin.                                |
| `kind`       | Non         | `"runtime-slash"` | Indique que l’alias est une commande oblique de discussion plutôt qu’une commande racine de la CLI. |
| `cliCommand` | Non         | `string`          | Commande racine de la CLI associée à suggérer pour les opérations de la CLI, s’il en existe une. |

## Référence d’activation

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût les événements du plan de contrôle qui doivent l’inclure dans un plan d’activation ou de chargement.

Ce bloc contient des métadonnées de planification, et non une API de cycle de vie. Il n’enregistre aucun comportement d’exécution, ne remplace pas `register(...)` et ne garantit pas que le code du Plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour réduire le nombre de Plugins candidats avant de revenir aux métadonnées de propriété existantes du manifeste, telles que `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` et les hooks.

Préférez les métadonnées les plus précises décrivant déjà la propriété. Utilisez `providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts` lorsque ces champs expriment la relation. Utilisez `activation` pour les indications de planification supplémentaires qui ne peuvent pas être représentées par ces champs de propriété. Utilisez `cliBackends` au niveau supérieur pour les alias d’exécution de la CLI tels que `claude-cli`, `my-cli` ou `google-gemini-cli` ; `activation.onAgentHarnesses` est réservé aux identifiants de harnais d’agent intégrés qui ne disposent pas déjà d’un champ de propriété.

Chaque Plugin doit définir `activation.onStartup` de manière intentionnelle. Définissez-le sur `true` uniquement lorsque le Plugin doit s’exécuter au démarrage du Gateway. Définissez-le sur `false` lorsque le Plugin est inactif au démarrage et ne doit être chargé qu’à partir de déclencheurs plus précis. L’omission de `onStartup` ne charge plus implicitement le Plugin au démarrage ; utilisez des métadonnées d’activation explicites pour les déclencheurs d’activation au démarrage, par canal, par configuration, par harnais d’agent, par mémoire ou pour d’autres déclencheurs plus précis.

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
| `onStartup`        | Non         | `boolean`                                            | Activation explicite au démarrage du Gateway. Chaque Plugin doit la définir. `true` importe le Plugin pendant le démarrage ; `false` conserve son chargement différé au démarrage, sauf si un autre déclencheur correspondant exige son chargement. |
| `onProviders`      | Non         | `string[]`                                           | Identifiants de fournisseurs qui doivent inclure ce Plugin dans les plans d’activation ou de chargement.                                                                                   |
| `onAgentHarnesses` | Non         | `string[]`                                           | Identifiants d’exécution des harnais d’agents intégrés qui doivent inclure ce Plugin dans les plans d’activation ou de chargement. Utilisez `cliBackends` au niveau supérieur pour les alias de moteur de la CLI. |
| `onCommands`       | Non         | `string[]`                                           | Identifiants de commandes qui doivent inclure ce Plugin dans les plans d’activation ou de chargement.                                                                                      |
| `onChannels`       | Non         | `string[]`                                           | Identifiants de canaux qui doivent inclure ce Plugin dans les plans d’activation ou de chargement.                                                                                         |
| `onRoutes`         | Non         | `string[]`                                           | Types de routes qui doivent inclure ce Plugin dans les plans d’activation ou de chargement.                                                                                                |
| `onConfigPaths`    | Non         | `string[]`                                           | Chemins de configuration relatifs à la racine qui doivent inclure ce Plugin dans les plans de démarrage ou de chargement lorsque le chemin est présent et n’est pas explicitement désactivé. |
| `onCapabilities`   | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications générales de capacités utilisées par la planification de l’activation du plan de contrôle. Préférez des champs plus précis lorsque cela est possible.                          |

Consommateurs actifs actuels :

- La planification du démarrage du Gateway utilise `activation.onStartup` pour l’importation explicite au démarrage.
- La planification de la CLI déclenchée par une commande se rabat sur les anciens `commandAliases[].cliCommand` ou `commandAliases[].name`.
- La planification du démarrage de l’environnement d’exécution de l’agent utilise `activation.onAgentHarnesses` pour les infrastructures de test intégrées et `cliBackends[]` de premier niveau pour les alias de l’environnement d’exécution de la CLI.
- La planification de la configuration ou du canal déclenchée par un canal se rabat sur la propriété historique `channels[]` lorsque les métadonnées explicites d’activation du canal sont absentes.
- La planification des plugins au démarrage utilise `activation.onConfigPaths` pour les surfaces de configuration racine hors canal, telles que le bloc `browser` du plugin de navigateur intégré.
- La planification de la configuration ou de l’environnement d’exécution déclenchée par un fournisseur se rabat sur la propriété historique `providers[]` et `cliBackends[]` de premier niveau lorsque les métadonnées explicites d’activation du fournisseur sont absentes.

Les diagnostics du planificateur peuvent distinguer les indications d’activation explicites du recours à la propriété du manifeste. Par exemple, `activation-command-hint` signifie que `activation.onCommands` correspondait, tandis que `manifest-command-alias` signifie que le planificateur a utilisé la propriété `commandAliases` à la place. Ces libellés de motif sont destinés aux diagnostics de l’hôte et aux tests ; les auteurs de plugins doivent continuer à déclarer les métadonnées qui décrivent le mieux la propriété.

## Référence de qaRunners

Utilisez `qaRunners` lorsqu’un plugin fournit un ou plusieurs exécuteurs de transport sous
la racine partagée `openclaw qa`. Ces métadonnées doivent rester légères et statiques ; l’environnement
d’exécution du plugin reste responsable de l’enregistrement réel dans la CLI au moyen d’une surface légère
`runtime-api.ts` qui exporte des `qaRunnerCliRegistrations` correspondants. Un
`adapterFactory` facultatif expose le transport aux scénarios d’assurance qualité partagés sans
modifier l’exécuteur de la commande enregistrée.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter le parcours d’assurance qualité en direct de Matrix basé sur Docker avec un serveur domestique jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Oui      | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.    |
| `description` | Non       | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

L’identifiant `adapterFactory` doit correspondre à `commandName`. N’exportez pas d’enregistrements
pour des commandes absentes du manifeste.

## Référence de setup

Utilisez `setup` lorsque les surfaces de configuration et d’intégration initiale ont besoin de métadonnées légères appartenant au plugin avant le chargement de l’environnement d’exécution.

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
            "source": "identifiants locaux openai"
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

Le `cliBackends` de premier niveau reste valide et continue de décrire les moteurs d’inférence de la CLI. `setup.cliBackends` est la surface de descripteurs propre à la configuration pour les flux du plan de contrôle et de configuration qui doivent rester fondés uniquement sur les métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` constituent la surface de recherche privilégiée, fondée d’abord sur les descripteurs, pour la découverte de la configuration. Si le descripteur se contente de restreindre le plugin candidat et que la configuration nécessite encore des hooks d’environnement d’exécution plus riches pendant la configuration, définissez `requiresRuntime: true` et conservez `setup-api` comme chemin d’exécution de repli.

OpenClaw inclut également `setup.providers[].envVars` dans les recherches génériques d’authentification de fournisseur et de variables d’environnement. `providerAuthEnvVars` reste pris en charge par un adaptateur de compatibilité pendant la période d’obsolescence, mais les plugins non intégrés qui l’utilisent encore reçoivent un diagnostic de manifeste. Les nouveaux plugins doivent placer les métadonnées d’environnement de configuration et d’état dans `setup.providers[].envVars`.

Utilisez `providerUsageAuthEnvVars` lorsqu’un identifiant de facturation ou de niveau organisationnel doit activer `resolveUsageAuth` sans devenir un identifiant d’inférence. Ces noms sont ajoutés au blocage de dotenv dans l’espace de travail, au retrait dans les processus enfants ACP, au filtrage des secrets du bac à sable et au nettoyage général des secrets. L’environnement d’exécution du fournisseur continue de lire et de classer la valeur dans `resolveUsageAuth`.

OpenClaw peut également déduire des choix de configuration simples à partir de `setup.providers[].authMethods` lorsqu’aucune entrée de configuration n’est disponible, ou lorsque `setup.requiresRuntime: false` indique que l’environnement d’exécution de configuration est inutile. Les entrées `providerAuthChoices` explicites restent privilégiées pour les libellés personnalisés, les options de la CLI, la portée de l’intégration initiale et les métadonnées de l’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs suffisent à la surface de configuration. OpenClaw traite un `false` explicite comme un contrat fondé uniquement sur les descripteurs et n’exécute pas `setup-api` ni `openclaw.setupEntry` pour la recherche de configuration. Si un plugin fondé uniquement sur les descripteurs fournit tout de même l’une de ces entrées d’environnement d’exécution de configuration, OpenClaw signale un diagnostic supplémentaire et continue de l’ignorer. L’omission de `requiresRuntime` conserve le comportement de repli historique afin que les plugins existants ayant ajouté des descripteurs sans l’indicateur ne cessent pas de fonctionner.

Comme la recherche de configuration peut exécuter du code `setup-api` appartenant au plugin, les valeurs normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les plugins découverts. En cas de propriété ambiguë, l’opération échoue de manière fermée au lieu de choisir un gagnant selon l’ordre de découverte.

Lorsque l’environnement d’exécution de configuration s’exécute, les diagnostics du registre de configuration signalent une divergence de descripteur si `setup-api` enregistre un fournisseur ou un moteur de CLI que les descripteurs du manifeste ne déclarent pas, ou si un descripteur ne possède aucun enregistrement correspondant dans l’environnement d’exécution. Ces diagnostics sont supplémentaires et ne rejettent pas les plugins historiques.

### Référence de setup.providers

| Champ          | Obligatoire | Type       | Signification                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Oui      | `string`   | Identifiant du fournisseur exposé pendant la configuration ou l’intégration initiale. Veillez à ce que les identifiants normalisés soient globalement uniques.             |
| `authMethods`  | Non       | `string[]` | Identifiants des méthodes de configuration et d’authentification prises en charge par ce fournisseur sans charger l’environnement d’exécution complet.                       |
| `envVars`      | Non       | `string[]` | Variables d’environnement que les surfaces génériques de configuration et d’état peuvent vérifier avant le chargement de l’environnement d’exécution du plugin.               |
| `authEvidence` | Non       | `object[]` | Vérifications légères des preuves d’authentification locales pour les fournisseurs pouvant s’authentifier au moyen de marqueurs non secrets. |

`authEvidence` est destiné aux marqueurs locaux d’identifiants appartenant au fournisseur qui peuvent être vérifiés sans charger le code de l’environnement d’exécution. Ces vérifications doivent rester légères et locales : aucun appel réseau, aucune lecture du trousseau ou du gestionnaire de secrets, aucune commande shell et aucune interrogation de l’API du fournisseur.

Entrées de preuve prises en charge :

| Champ              | Obligatoire | Type       | Signification                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Oui      | `string`   | Actuellement `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Non       | `string`   | Variable d’environnement contenant un chemin explicite vers un fichier d’identifiants.                                                           |
| `fallbackPaths`    | Non       | `string[]` | Chemins locaux de fichiers d’identifiants vérifiés lorsque `fileEnvVar` est absent ou vide. Prend en charge `${HOME}` et `${APPDATA}`. |
| `requiresAnyEnv`   | Non       | `string[]` | Au moins une des variables d’environnement répertoriées doit être non vide pour que la preuve soit valide.                                    |
| `requiresAllEnv`   | Non       | `string[]` | Toutes les variables d’environnement répertoriées doivent être non vides pour que la preuve soit valide.                                           |
| `credentialMarker` | Oui      | `string`   | Marqueur non secret renvoyé lorsque la preuve est présente.                                                       |
| `source`           | Non       | `string`   | Libellé de source visible par l’utilisateur pour la sortie d’authentification et d’état.                                                               |

### Champs de setup

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non       | `object[]` | Descripteurs de configuration du fournisseur exposés pendant la configuration et l’intégration initiale.                                     |
| `cliBackends`      | Non       | `string[]` | Identifiants des moteurs utilisés pendant la configuration pour la recherche de configuration fondée d’abord sur les descripteurs. Veillez à ce que les identifiants normalisés soient globalement uniques. |
| `configMigrations` | Non       | `string[]` | Identifiants de migration de configuration appartenant à la surface de configuration de ce plugin.                                          |
| `requiresRuntime`  | Non       | `boolean`  | Indique si la configuration nécessite encore l’exécution de `setup-api` après la recherche par descripteur.                            |

## Référence de uiHints

`uiHints` est une table de correspondance entre les noms de champs de configuration et de petites indications de rendu. Les clés peuvent utiliser des points pour les champs de configuration imbriqués, mais aucun segment de chemin ne peut être `__proto__`, `constructor` ou `prototype` ; la configuration rejette ces noms.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clé d’API",
      "help": "Utilisée pour les requêtes OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé du champ visible par l’utilisateur.                |
| `help`        | `string`   | Court texte d’aide.                      |
| `tags`        | `string[]` | Balises facultatives de l’interface utilisateur.                       |
| `advanced`    | `boolean`  | Marque le champ comme avancé.            |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte indicatif pour les champs de formulaire.       |

## Référence de contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété des capacités qu’OpenClaw peut lire sans importer l’environnement d’exécution du plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identifiants de fabriques d’extensions du serveur d’application Codex, actuellement `codex-app-server`.                              |
| `agentToolResultMiddleware`      | `string[]` | Identifiants d’environnements d’exécution pour lesquels ce plugin peut enregistrer un middleware de résultats d’outils.              |
| `trustedToolPolicies`            | `string[]` | Identifiants locaux au plugin des politiques approuvées préalables aux outils qu’un plugin installé peut enregistrer. Les plugins intégrés peuvent enregistrer des politiques sans ce champ. |
| `externalAuthProviders`          | `string[]` | Identifiants des fournisseurs dont ce plugin possède le hook de profil d’authentification externe.                                  |
| `embeddingProviders`             | `string[]` | Identifiants des fournisseurs généraux d’incorporations vectorielles que ce plugin possède pour un usage réutilisable, notamment par la mémoire. |
| `speechProviders`                | `string[]` | Identifiants des fournisseurs vocaux que ce plugin possède.                                                                         |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants des fournisseurs de transcription en temps réel que ce plugin possède.                                                 |
| `realtimeVoiceProviders`         | `string[]` | Identifiants des fournisseurs de voix en temps réel que ce plugin possède.                                                          |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants obsolètes des fournisseurs d’incorporations propres à la mémoire que ce plugin possède.                                |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants des fournisseurs de compréhension des médias que ce plugin possède.                                                    |
| `transcriptSourceProviders`      | `string[]` | Identifiants des fournisseurs de sources de transcription que ce plugin possède.                                                    |
| `documentExtractors`             | `string[]` | Identifiants des fournisseurs d’extraction de documents (par exemple PDF) que ce plugin possède.                                    |
| `imageGenerationProviders`       | `string[]` | Identifiants des fournisseurs de génération d’images que ce plugin possède.                                                         |
| `videoGenerationProviders`       | `string[]` | Identifiants des fournisseurs de génération de vidéos que ce plugin possède.                                                        |
| `musicGenerationProviders`       | `string[]` | Identifiants des fournisseurs de génération de musique que ce plugin possède.                                                       |
| `webContentExtractors`           | `string[]` | Identifiants des fournisseurs d’extraction du contenu de pages Web que ce plugin possède.                                           |
| `webFetchProviders`              | `string[]` | Identifiants des fournisseurs de récupération Web que ce plugin possède.                                                           |
| `webSearchProviders`             | `string[]` | Identifiants des fournisseurs de recherche Web que ce plugin possède.                                                              |
| `workerProviders`                | `string[]` | Identifiants des fournisseurs de workers cloud que ce plugin possède pour le provisionnement et le cycle de vie des locations associées à un profil. |
| `usageProviders`                 | `string[]` | Identifiants des fournisseurs dont ce plugin possède les hooks d’authentification de l’utilisation et d’instantané d’utilisation.  |
| `migrationProviders`             | `string[]` | Identifiants des fournisseurs d’importation que ce plugin possède pour `openclaw migrate`.                                         |
| `gatewayMethodDispatch`          | `string[]` | Droit réservé aux routes HTTP authentifiées du plugin qui distribuent des méthodes du Gateway dans le processus.                    |
| `tools`                          | `string[]` | Noms des outils d’agent que ce plugin possède.                                                                                       |

`contracts.embeddedExtensionFactories` est conservé pour les fabriques d’extensions intégrées réservées au serveur d’application Codex. Les transformations intégrées de résultats d’outils doivent plutôt déclarer `contracts.agentToolResultMiddleware` et s’enregistrer avec `api.registerAgentToolResultMiddleware(...)`. Les plugins installés ne peuvent utiliser le même point d’extension du middleware que lorsqu’ils sont explicitement activés, et uniquement pour les environnements d’exécution qu’ils déclarent dans `contracts.agentToolResultMiddleware`.

Les plugins installés qui nécessitent le niveau de politique préalable aux outils approuvé par l’hôte doivent déclarer chaque identifiant local enregistré dans `contracts.trustedToolPolicies` et être explicitement activés. Les plugins intégrés conservent le chemin existant des politiques approuvées, mais les plugins installés dont les identifiants de politique ne sont pas déclarés sont rejetés avant l’enregistrement. Les identifiants de politique sont limités à la portée du plugin qui les enregistre ; deux plugins peuvent donc tous deux déclarer et enregistrer `workflow-budget`, mais un même plugin ne peut pas enregistrer deux fois le même identifiant local.

Les enregistrements d’environnement d’exécution `api.registerTool(...)` doivent correspondre à `contracts.tools`. La découverte d’outils utilise cette liste pour ne charger que les environnements d’exécution de plugin susceptibles de posséder les outils demandés.

Les plugins de fournisseur qui implémentent `resolveExternalAuthProfiles` doivent déclarer `contracts.externalAuthProviders` ; les hooks d’authentification externe non déclarés sont ignorés.

Les plugins de fournisseur qui implémentent à la fois `resolveUsageAuth` et `fetchUsageSnapshot` doivent déclarer dans `contracts.usageProviders` chaque identifiant de fournisseur découvert automatiquement. La découverte de l’utilisation lit ce contrat avant de charger le code d’exécution, puis vérifie les deux hooks après n’avoir chargé que les propriétaires déclarés.

Les fournisseurs généraux d’incorporations doivent déclarer `contracts.embeddingProviders` pour chaque adaptateur enregistré avec `api.registerEmbeddingProvider(...)`. Utilisez le contrat général pour la génération réutilisable de vecteurs, notamment pour les fournisseurs utilisés par la recherche en mémoire. `contracts.memoryEmbeddingProviders` est une compatibilité propre à la mémoire désormais obsolète et n’est conservé que pendant la migration des fournisseurs existants vers le point d’extension générique des fournisseurs d’incorporations.

Les fournisseurs de workers doivent déclarer chaque identifiant `api.registerWorkerProvider(...)` dans `contracts.workerProviders`. Le cœur conserve l’intention durable avant d’appeler `provision` ; les fournisseurs valident leurs paramètres avant l’allocation externe, et les appels répétés avec le même identifiant d’opération doivent adopter la même location. Le cœur conserve également cet instantané des paramètres validés et le transmet avec `leaseId` à `inspect({ leaseId, profile })` et `destroy({ leaseId, profile })`, y compris après la modification ou la suppression du profil nommé. La destruction est idempotente, l’inspection renvoie l’union fermée d’états `active` / `destroyed` / `unknown`, et le contenu de la clé privée SSH n’est référencé que par l’intermédiaire de `SecretRef`. Les points de terminaison SSH provisionnés doivent également inclure une valeur publique `hostKey` issue d’une sortie de provisionnement approuvée, sous la forme exacte `algorithm base64`, sans nom d’hôte ni commentaire, afin que le cœur puisse épingler l’hôte avant la connexion. Les fournisseurs qui créent des références d’identité dynamiques peuvent implémenter la méthode faisant autorité `resolveSshIdentity({ leaseId, profile, keyRef })` ; ceux qui ne l’implémentent pas utilisent le résolveur générique de secrets du cœur. Une valeur faisant autorité `unknown` rend orphelin un enregistrement local actif ; après une demande de destruction conservée, elle confirme la suppression.

`contracts.gatewayMethodDispatch` accepte actuellement `"authenticated-request"`. Il s’agit d’une barrière d’hygiène d’API pour les routes HTTP natives de plugin qui distribuent intentionnellement, dans le processus, des méthodes du plan de contrôle du Gateway, et non d’un bac à sable contre les plugins natifs malveillants. Utilisez-le uniquement pour les surfaces intégrées ou destinées aux opérateurs, soumises à un examen rigoureux et exigeant déjà l’authentification HTTP du Gateway. Une route disposant de ce droit reste accessible lorsque l’admission du travail racine du Gateway est fermée uniquement si elle déclare également `auth: "gateway"` et la valeur propre à la route `gatewayRuntimeScopeSurface: "trusted-operator"` ; les routes sœurs ordinaires du même plugin restent derrière la limite d’admission. L’état de suspension et la reprise restent ainsi accessibles sans accorder à l’ensemble du plugin un contournement de l’admission. Limitez l’analyse et la mise en forme des réponses en dehors de la distribution ; tout travail substantiel ou entraînant une mutation doit passer par la distribution des méthodes du Gateway, qui assure l’admission et l’application des portées.

## Référence de configContracts

Utilisez `configContracts` pour les comportements de configuration appartenant au manifeste dont les assistants génériques du cœur ont besoin sans importer l’environnement d’exécution du plugin : détection des indicateurs dangereux, cibles de migration SecretRef et restriction des anciens chemins de configuration.

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| Champ                         | Obligatoire | Type       | Signification                                                                                                                                                                                                                          |
| ----------------------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | Non       | `string[]` | Chemins de configuration relatifs à la racine indiquant que les migrations de compatibilité de ce plugin lors de la configuration sont susceptibles de s’appliquer. Permet aux lectures génériques de la configuration d’exécution d’ignorer toutes les surfaces de configuration du plugin lorsque la configuration ne fait jamais référence à celui-ci. |
| `compatibilityRuntimePaths`   | Non       | `string[]` | Chemins de compatibilité relatifs à la racine que ce plugin peut prendre en charge pendant l’exécution, avant l’activation complète de son code. Utilisez-les pour les anciennes surfaces qui doivent restreindre les ensembles de candidats intégrés sans importer chaque environnement d’exécution de plugin compatible. |
| `dangerousFlags`              | Non       | `object[]` | Littéraux de configuration que `openclaw doctor` doit signaler comme non sécurisés ou dangereux lorsqu’ils sont activés. Voir ci-dessous. |
| `secretInputs`                | Non       | `object`   | Chemins de configuration sous `plugins.entries.<id>.config` que le registre des cibles de migration et d’audit SecretRef doit traiter comme des chaînes ayant la forme de secrets. Voir ci-dessous. |

Chaque entrée `dangerousFlags` prend en charge :

| Champ    | Obligatoire | Type                                  | Signification                                                                                                       |
| -------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | Oui      | `string`                              | Chemin de configuration séparé par des points, relatif à `plugins.entries.<id>.config`. Prend en charge les caractères génériques `*` pour les segments de mappage ou de tableau. |
| `equals` | Oui      | `string \| number \| boolean \| null` | Littéral exact qui marque cette valeur de configuration comme dangereuse.                                           |

`secretInputs` prend en charge :

| Champ                   | Obligatoire | Type       | Signification                                                                                                                                                                                                   |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | Non       | `boolean`  | Remplace l’activation par défaut du plugin intégré lors de la détermination de l’état actif de cette surface SecretRef. Utilisez cette option lorsque le plugin est intégré, mais que la surface doit rester inactive jusqu’à son activation explicite dans la configuration. |
| `paths`                 | Oui      | `object[]` | Chemins de configuration contenant des secrets, chacun avec `path` (séparé par des points, relatif à `plugins.entries.<id>.config`, prend en charge les caractères génériques `*`) et `expected` facultatif (actuellement uniquement `"string"`).                            |

## Référence de mediaUnderstandingProviderMetadata

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias possède des modèles par défaut, une priorité de repli d’authentification automatique ou une prise en charge native des documents dont les assistants génériques du cœur ont besoin avant le chargement de l’environnement d’exécution. Les clés doivent également être déclarées dans `contracts.mediaUnderstandingProviders`.

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

Chaque entrée de fournisseur peut inclure :

| Champ                  | Type                                                             | Signification                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | Capacités multimédias exposées par ce fournisseur.                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | Valeurs par défaut associant les capacités aux modèles, utilisées lorsque la configuration ne spécifie aucun modèle.                                         |
| `autoPriority`         | `Record<string, number>`                                         | Les nombres inférieurs sont classés en premier pour le repli automatique vers un fournisseur fondé sur les identifiants d’authentification.                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | Entrées de documents natives prises en charge par le fournisseur.                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | Remplacements de modèles par type de document. Définissez `image: false` pour désactiver l’extraction fondée sur les images pour ce type de document. |

## Référence de channelConfigs

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de configuration peu coûteuses avant le chargement de l’environnement d’exécution. La découverte en lecture seule de la configuration et de l’état des canaux peut utiliser directement ces métadonnées pour les canaux externes configurés lorsqu’aucune entrée de configuration n’est disponible, ou lorsque `setup.requiresRuntime: false` indique que l’environnement d’exécution de configuration n’est pas nécessaire.

`channelConfigs` constitue une métadonnée du manifeste du plugin, et non une nouvelle section de configuration utilisateur de premier niveau. Les utilisateurs configurent toujours les instances de canal sous `channels.<channel-id>`. OpenClaw lit les métadonnées du manifeste pour déterminer quel plugin possède ce canal configuré avant l’exécution du code d’environnement d’exécution du plugin.

Pour un plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les plugins non intégrés qui déclarent `channels[]` doivent également déclarer les entrées `channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le plugin, mais le schéma de configuration du chemin à froid, la configuration et les surfaces de l’interface de contrôle ne peuvent pas connaître la structure des options appartenant au canal avant l’exécution de l’environnement d’exécution du plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et `nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut `auto` statiques pour les vérifications de configuration des commandes exécutées avant le chargement de l’environnement d’exécution du canal. Les canaux intégrés peuvent également publier les mêmes valeurs par défaut via `package.json#openclaw.channel.commands`, avec leurs autres métadonnées de catalogue de canaux appartenant au paquet.

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
          "label": "URL du serveur d’accueil",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connexion au serveur d’accueil Matrix",
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
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée de configuration de canal déclarée.         |
| `uiHints`     | `Record<string, object>` | Libellés d’interface, textes indicatifs et indications de sensibilité facultatifs pour cette section de configuration du canal.          |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées d’environnement d’exécution ne sont pas prêtes. |
| `description` | `string`                 | Brève description du canal pour les surfaces d’inspection et de catalogue.                               |
| `commands`    | `object`                 | Valeurs automatiques par défaut statiques des commandes natives et des Skills natifs pour les vérifications de configuration antérieures à l’environnement d’exécution.       |
| `preferOver`  | `string[]`               | Identifiants des plugins anciens ou de priorité inférieure que ce canal doit devancer dans les surfaces de sélection.    |

### Remplacement d’un autre plugin de canal

Utilisez `preferOver` lorsque votre plugin est le propriétaire privilégié d’un identifiant de canal qu’un autre plugin peut également fournir. Les cas courants comprennent un identifiant de plugin renommé, un plugin autonome qui remplace un plugin intégré ou un fork maintenu qui conserve le même identifiant de canal pour assurer la compatibilité de la configuration.

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

Lorsque `channels.chat` est configuré, OpenClaw prend en compte à la fois l’identifiant du canal et l’identifiant du plugin privilégié. Si le plugin de priorité inférieure a été sélectionné uniquement parce qu’il est intégré ou activé par défaut, OpenClaw le désactive dans la configuration effective de l’environnement d’exécution afin qu’un seul plugin possède le canal et ses outils. La sélection explicite de l’utilisateur reste prioritaire : si l’utilisateur active explicitement les deux plugins (via `plugins.allow` ou une configuration `plugins.entries` substantielle), OpenClaw préserve ce choix et signale des diagnostics de duplication des canaux ou des outils au lieu de modifier silencieusement l’ensemble de plugins demandé.

Limitez `preferOver` aux identifiants de plugins qui peuvent réellement fournir le même canal. Il ne s’agit pas d’un champ de priorité général et il ne renomme pas les clés de configuration utilisateur.

## Référence de modelSupport

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre plugin fournisseur à partir d’identifiants de modèles abrégés tels que `gpt-5.6-sol` ou `claude-sonnet-4.6` avant le chargement de l’environnement d’exécution du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique l’ordre de priorité suivant :

- les références `provider/model` explicites utilisent les métadonnées du manifeste `providers` propriétaire
- `modelPatterns` sont prioritaires sur `modelPrefixes`
- si un plugin non intégré et un plugin intégré correspondent tous deux, le plugin non intégré est prioritaire
- toute ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants de modèles abrégés.                 |
| `modelPatterns` | `string[]` | Sources d’expressions régulières comparées aux identifiants de modèles abrégés après suppression du suffixe de profil. |

Les entrées `modelPatterns` sont compilées par `compileSafeRegex`, qui rejette les motifs contenant des répétitions imbriquées (par exemple `(a+)+$`). Les motifs qui échouent au contrôle de sécurité sont ignorés silencieusement, comme les expressions régulières syntaxiquement incorrectes. Gardez les motifs simples et évitez les quantificateurs imbriqués.

## Référence de modelCatalog

Utilisez `modelCatalog` lorsqu’OpenClaw doit connaître les métadonnées des modèles du fournisseur avant le chargement de l’environnement d’exécution du plugin. Il s’agit de la source appartenant au manifeste pour les lignes fixes du catalogue, les alias de fournisseurs, les règles de suppression et le mode de découverte. L’actualisation à l’exécution relève toujours du code d’environnement d’exécution du fournisseur, mais le manifeste indique au cœur quand cet environnement est nécessaire.

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
        "reason": "non disponible sur Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Champs de premier niveau :

| Champ            | Type                                                     | Signification                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Entrées de catalogue pour les identifiants de fournisseurs appartenant à ce plugin. Les clés doivent également figurer dans `providers` au niveau supérieur.       |
| `aliases`        | `Record<string, object>`                                 | Alias de fournisseurs qui doivent être résolus vers un fournisseur détenu pour la planification du catalogue ou de la suppression.              |
| `suppressions`   | `object[]`                                               | Entrées de modèles provenant d’une autre source que ce plugin supprime pour une raison propre au fournisseur.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées du manifeste, actualisé dans le cache ou nécessite le runtime. |
| `runtimeAugment` | `boolean`                                                | Définissez sur `true` uniquement lorsque le runtime du fournisseur doit ajouter des entrées de catalogue après la planification du manifeste et de la configuration.       |

`aliases` participe à la recherche de propriété du fournisseur pour la planification du catalogue de modèles. Les cibles d’alias doivent être des fournisseurs de niveau supérieur appartenant au même plugin. Lorsqu’une liste filtrée par fournisseur utilise un alias, OpenClaw peut lire le manifeste propriétaire et appliquer les remplacements d’API et d’URL de base de l’alias sans charger le runtime du fournisseur. Les alias n’étendent pas les listes de catalogue non filtrées ; les listes générales n’émettent que les entrées du fournisseur canonique propriétaire.

`suppressions` remplace l’ancien hook `suppressBuiltInModel` du runtime du fournisseur. Les entrées de suppression ne sont prises en compte que lorsque le fournisseur appartient au plugin ou est déclaré comme une clé `modelCatalog.aliases` ciblant un fournisseur détenu. Les hooks de suppression du runtime ne sont plus appelés lors de la résolution des modèles.

Champs du fournisseur :

| Champ                 | Type                     | Signification                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | URL de base par défaut facultative pour les modèles de ce catalogue de fournisseur.                                                                                                                                                    |
| `api`                 | `ModelApi`               | Adaptateur d’API par défaut facultatif pour les modèles de ce catalogue de fournisseur.                                                                                                                                                 |
| `headers`             | `Record<string, string>` | En-têtes statiques facultatifs applicables à ce catalogue de fournisseur.                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | Identifiant facultatif d’un petit modèle recommandé par le fournisseur pour de courtes tâches utilitaires internes (titres, narration de la progression). Utilisé lorsque `agents.defaults.utilityModel` n’est pas défini et que ce fournisseur sert le modèle principal de l’agent. |
| `models`              | `object[]`               | Entrées de modèles obligatoires. Les entrées sans `id` sont ignorées.                                                                                                                                                            |

Champs du modèle :

| Champ              | Type                                                           | Signification                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | Identifiant de modèle local au fournisseur, sans le préfixe `provider/`.                    |
| `name`             | `string`                                                       | Nom d’affichage facultatif.                                                      |
| `api`              | `ModelApi`                                                     | Remplacement d’API facultatif propre au modèle.                                            |
| `baseUrl`          | `string`                                                       | Remplacement d’URL de base facultatif propre au modèle.                                       |
| `headers`          | `Record<string, string>`                                       | En-têtes statiques facultatifs propres au modèle.                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | Modalités acceptées par le modèle. Les autres valeurs sont supprimées silencieusement.            |
| `reasoning`        | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.                               |
| `contextWindow`    | `number`                                                       | Fenêtre de contexte native du fournisseur.                                             |
| `contextTokens`    | `number`                                                       | Limite effective facultative du contexte du runtime lorsqu’elle diffère de `contextWindow`. |
| `maxTokens`        | `number`                                                       | Nombre maximal de tokens de sortie lorsqu’il est connu.                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | Remplacements facultatifs de l’identifiant de modèle ou des paramètres pour chaque niveau de réflexion.                    |
| `cost`             | `object`                                                       | Tarification facultative en USD par million de tokens, y compris `tieredPricing` facultatif. |
| `compat`           | `object`                                                       | Indicateurs de compatibilité facultatifs correspondant à la compatibilité de la configuration des modèles OpenClaw.  |
| `mediaInput`       | `object`                                                       | Configuration d’entrée facultative par modalité, actuellement réservée aux images.                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | État de référencement. Ne supprimez l’entrée que si elle ne doit absolument pas apparaître.          |
| `statusReason`     | `string`                                                       | Motif facultatif affiché avec un état d’indisponibilité.                            |
| `replaces`         | `string[]`                                                     | Anciens identifiants de modèles locaux au fournisseur que ce modèle remplace.                       |
| `replacedBy`       | `string`                                                       | Identifiant de modèle local au fournisseur de remplacement pour les entrées obsolètes.                    |
| `tags`             | `string[]`                                                     | Étiquettes stables utilisées par les sélecteurs et les filtres.                                    |

Champs de suppression :

| Champ                      | Type       | Signification                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identifiant du fournisseur de l’entrée en amont à supprimer. Il doit appartenir à ce plugin ou être déclaré comme un alias détenu. |
| `model`                    | `string`   | Identifiant de modèle local au fournisseur à supprimer.                                                                      |
| `reason`                   | `string`   | Message facultatif affiché lorsque l’entrée supprimée est demandée directement.                                     |
| `when.baseUrlHosts`        | `string[]` | Liste facultative des hôtes d’URL de base effectifs du fournisseur requis avant l’application de la suppression.               |
| `when.providerConfigApiIn` | `string[]` | Liste facultative des valeurs `api` exactes de la configuration du fournisseur requises avant l’application de la suppression.              |

Ne placez pas de données disponibles uniquement au runtime dans `modelCatalog`. Utilisez `static` uniquement lorsque les entrées du manifeste sont suffisamment complètes pour que les listes filtrées par fournisseur et les surfaces de sélection puissent ignorer la découverte du registre et du runtime. Utilisez `refreshable` lorsque les entrées du manifeste constituent des entrées initiales ou complémentaires utiles à répertorier, mais qu’une actualisation ou un cache peut ajouter d’autres entrées ultérieurement ; les entrées actualisables ne font pas autorité à elles seules. Utilisez `runtime` lorsqu’OpenClaw doit charger le runtime du fournisseur pour connaître la liste.

## Référence de modelIdNormalization

Utilisez `modelIdNormalization` pour le nettoyage peu coûteux des identifiants de modèles appartenant au fournisseur qui doit avoir lieu avant le chargement du runtime du fournisseur. Cela permet de conserver les alias tels que les noms courts de modèles, les anciens identifiants locaux au fournisseur et les règles de préfixe des proxys dans le manifeste du plugin propriétaire plutôt que dans les tables centrales de sélection des modèles.

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
| `aliases`                            | `Record<string,string>` | Alias exacts d’identifiants de modèles insensibles à la casse. Les valeurs sont renvoyées telles qu’elles sont écrites.                  |
| `stripPrefixes`                      | `string[]`              | Préfixes à supprimer avant la recherche d’alias, utiles pour les anciennes duplications fournisseur/modèle.     |
| `prefixWhenBare`                     | `string`                | Préfixe à ajouter lorsque l’identifiant de modèle normalisé ne contient pas déjà `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Règles conditionnelles de préfixe pour les identifiants sans préfixe après la recherche d’alias, indexées par `modelPrefix` et `prefix`. |

## Référence de providerEndpoints

Utilisez `providerEndpoints` pour la classification des points de terminaison que la politique générique de requêtes doit connaître avant le chargement du runtime du fournisseur. Le cœur définit toujours la signification de chaque `endpointClass` ; les manifestes des plugins définissent les métadonnées de l’hôte et de l’URL de base.

Les plugins de fournisseurs officiellement externalisés sont exclus de la distribution principale, de sorte que
leurs manifestes restent invisibles tant qu’ils ne sont pas installés. Leurs `providerEndpoints` doivent
également être reproduits dans `scripts/lib/official-external-provider-catalog.json` afin que
la classification des points de terminaison continue de fonctionner sans le plugin ; un test de contrat
impose cette reproduction.

Champs des points de terminaison :

| Champ                          | Type       | Signification                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de point de terminaison principale connue, telle que `openrouter`, `moonshot-native` ou `google-vertex`.        |
| `hosts`                        | `string[]` | Noms d’hôte exacts associés à la classe de point de terminaison.                                                |
| `hostSuffixes`                 | `string[]` | Suffixes d’hôte associés à la classe de point de terminaison. Ajoutez le préfixe `.` pour limiter la correspondance aux suffixes de domaine. |
| `baseUrls`                     | `string[]` | URL de base HTTP(S) normalisées exactes associées à la classe de point de terminaison.                             |
| `googleVertexRegion`           | `string`   | Région Google Vertex statique pour les hôtes globaux exacts.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffixe à retirer des hôtes correspondants pour exposer le préfixe de région Google Vertex.                 |

## Référence de providerRequest

Utilisez `providerRequest` pour les métadonnées peu coûteuses de compatibilité des requêtes dont la stratégie générique de requête a besoin sans charger l’environnement d’exécution du fournisseur. Conservez la réécriture des charges utiles propre au comportement dans les hooks d’environnement d’exécution du fournisseur ou dans les assistants partagés de la famille de fournisseurs.

```json
{
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
| `compatibilityFamily` | `"moonshot"` | Groupe facultatif de compatibilité de famille de fournisseurs pour les assistants de requête partagés.              |
| `openAICompletions`   | `object`     | Indicateurs des requêtes de complétion compatibles avec OpenAI, actuellement `supportsStreamingUsage`.       |

## Référence de secretProviderIntegrations

Utilisez `secretProviderIntegrations` lorsqu’un plugin peut publier un préréglage réutilisable de fournisseur d’exécution SecretRef. OpenClaw lit ces métadonnées avant le chargement de l’environnement d’exécution du plugin, enregistre la propriété du plugin dans `secrets.providers.<alias>.pluginIntegration` et laisse la résolution effective des secrets à l’environnement d’exécution SecretRef. Les préréglages sont exposés uniquement pour les plugins intégrés et les plugins installés détectés dans les racines d’installation de plugins gérées, comme les installations git et ClawHub.

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

La clé de la table de correspondance est l’identifiant de l’intégration. Si `providerAlias` est omis, OpenClaw utilise l’identifiant de l’intégration comme alias du fournisseur SecretRef. Les alias de fournisseurs doivent respecter le modèle normal des alias de fournisseurs SecretRef, par exemple `team-secrets` ou `onepassword-work`.

Lorsqu’un opérateur sélectionne le préréglage, OpenClaw écrit une référence de fournisseur comme suit :

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

Au démarrage ou au rechargement, OpenClaw résout ce fournisseur en chargeant les métadonnées actuelles du manifeste du plugin, en vérifiant que le plugin propriétaire est installé et actif, puis en matérialisant la commande d’exécution à partir du manifeste. La désactivation ou la suppression du plugin révoque le fournisseur pour les SecretRefs actives. Les opérateurs souhaitant une configuration d’exécution autonome peuvent toujours écrire directement des fournisseurs manuels `command`/`args`.

Seuls les préréglages `source: "exec"` sont actuellement pris en charge. `command` doit être `${node}`, et `args[0]` doit être un script de résolution `./` relatif à la racine du plugin. Au démarrage ou au rechargement, OpenClaw le matérialise avec l’exécutable Node actuel et le chemin absolu du script dans le plugin. Les options Node telles que `--require`, `--import`, `--loader`, `--env-file`, `--eval` et `--print` ne font pas partie du contrat des préréglages de manifeste. Les opérateurs qui ont besoin de commandes autres que Node peuvent configurer directement des fournisseurs d’exécution manuels autonomes.

Pour les préréglages de manifeste, OpenClaw dérive `trustedDirs` à partir de la racine du plugin et, pour les préréglages `${node}`, du répertoire de l’exécutable Node actuel. Les `trustedDirs` définis dans le manifeste sont ignorés. Les autres options de fournisseur d’exécution telles que `timeoutMs`, `noOutputTimeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` et `allowInsecurePath` sont transmises à la configuration normale du fournisseur d’exécution SecretRef.

## Référence de modelPricing

Utilisez `modelPricing` lorsqu’un fournisseur doit contrôler le comportement de tarification du plan de contrôle avant le chargement de l’environnement d’exécution. Le cache de tarification du Gateway lit ces métadonnées sans importer le code d’environnement d’exécution du fournisseur.

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
| `external`   | `boolean`         | Définissez `false` pour les fournisseurs locaux ou auto-hébergés qui ne doivent jamais récupérer les tarifs d’OpenRouter ou de LiteLLM. |
| `openRouter` | `false \| object` | Correspondance pour la recherche des tarifs OpenRouter. `false` désactive la recherche OpenRouter pour ce fournisseur.           |
| `liteLLM`    | `false \| object` | Correspondance pour la recherche des tarifs LiteLLM. `false` désactive la recherche LiteLLM pour ce fournisseur.                 |

Champs de la source :

| Champ                      | Type               | Signification                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Identifiant du fournisseur dans le catalogue externe lorsqu’il diffère de l’identifiant du fournisseur OpenClaw, par exemple `z-ai` pour un fournisseur `zai`. |
| `passthroughProviderModel` | `boolean`          | Traite les identifiants de modèle contenant des barres obliques comme des références imbriquées fournisseur/modèle, ce qui est utile pour les fournisseurs mandataires tels qu’OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes supplémentaires d’identifiants de modèle du catalogue externe. `version-dots` essaie les identifiants de version avec points tels que `claude-opus-4.6`.            |

### Index des fournisseurs OpenClaw

L’index des fournisseurs OpenClaw est constitué de métadonnées d’aperçu détenues par OpenClaw pour les fournisseurs dont les plugins ne sont peut-être pas encore installés. Il ne fait pas partie d’un manifeste de plugin. Les manifestes de plugins restent l’autorité pour les plugins installés. L’index des fournisseurs est le contrat de repli interne que les futures interfaces de sélection de modèles avant installation et de fournisseurs installables utiliseront lorsqu’un plugin de fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. Manifeste du plugin installé `modelCatalog`.
3. Cache du catalogue de modèles issu d’une actualisation explicite.
4. Lignes d’aperçu de l’index des fournisseurs OpenClaw.

L’index des fournisseurs ne doit contenir ni secrets, ni état d’activation, ni hooks d’environnement d’exécution, ni données de modèles en direct propres à un compte. Ses catalogues d’aperçu utilisent la même forme de ligne de fournisseur `modelCatalog` que les manifestes de plugins, mais doivent rester limités à des métadonnées d’affichage stables, sauf si des champs d’adaptateur d’environnement d’exécution tels que `api`, `baseUrl`, la tarification ou les indicateurs de compatibilité sont intentionnellement maintenus en phase avec le manifeste du plugin installé. Les fournisseurs disposant d’une détection `/models` en direct doivent écrire les lignes actualisées par le chemin explicite du cache du catalogue de modèles plutôt que de faire appeler les API du fournisseur par les opérations normales de listage ou d’intégration.

Les entrées de l’index des fournisseurs peuvent également contenir des métadonnées de plugin installable pour les fournisseurs dont le plugin a été déplacé hors du cœur ou n’est pas encore installé pour une autre raison. Ces métadonnées reprennent le modèle du catalogue des canaux : le nom du paquet, la spécification d’installation npm, l’intégrité attendue et des libellés peu coûteux de choix d’authentification suffisent pour afficher une option de configuration installable. Une fois le plugin installé, son manifeste prévaut et l’entrée de l’index des fournisseurs est ignorée pour ce fournisseur.

`openclaw doctor --fix` migre un petit ensemble fermé d’anciennes clés de capacité de manifeste de premier niveau vers `contracts.*` : `speechProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders` et `tools`. Aucune de ces clés — ni aucune autre liste de capacités — n’est désormais lue comme champ de premier niveau du manifeste ; le chargement normal du manifeste ne les reconnaît que sous `contracts`.

## Manifeste ou package.json

Les deux fichiers remplissent des fonctions différentes :

| Fichier                   | Utilisation                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Détection, validation de la configuration, métadonnées des choix d’authentification et indications d’interface utilisateur qui doivent exister avant l’exécution du code du plugin                         |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, les conditions d’installation, la configuration ou les métadonnées de catalogue |

En cas de doute sur l’emplacement d’une métadonnée, appliquez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le conditionnement, les fichiers d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs de package.json qui influent sur la détection

Certaines métadonnées de plugin antérieures à l’exécution résident intentionnellement dans `package.json`, sous le bloc `openclaw`, plutôt que dans `openclaw.plugin.json`. `openclaw.bundle` et `openclaw.bundle.json` ne sont pas des contrats de plugin OpenClaw ; les plugins natifs doivent utiliser `openclaw.plugin.json` ainsi que les champs `package.json#openclaw` pris en charge ci-dessous.

Exemples importants :

| Champ                                                                                      | Signification                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Déclare les points d’entrée natifs du plugin. Ils doivent rester dans le répertoire du package du plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Déclare les points d’entrée d’exécution JavaScript compilés pour les packages installés. Ils doivent rester dans le répertoire du package du plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Point d’entrée léger réservé à la configuration, utilisé pendant l’intégration, le démarrage différé des canaux et la découverte en lecture seule de l’état du canal et des SecretRef. Il doit rester dans le répertoire du package du plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Nécessite `setupEntry`, doit exister et doit rester dans le répertoire du package du plugin.                         |
| `openclaw.channel`                                                                         | Métadonnées légères du catalogue de canaux, telles que les libellés, les chemins de documentation, les alias et le texte de sélection.                                                                                                 |
| `openclaw.channel.commands`                                                                | Métadonnées statiques des commandes natives et des valeurs automatiques par défaut des Skills natives, utilisées par les surfaces de configuration, d’audit et de liste des commandes avant le chargement de l’environnement d’exécution du canal.                                          |
| `openclaw.channel.configuredState`                                                         | Métadonnées légères de vérification de l’état configuré permettant de déterminer si une configuration reposant uniquement sur l’environnement existe déjà, sans charger l’environnement d’exécution complet du canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Métadonnées légères de vérification de l’authentification persistante permettant de déterminer si une session est déjà ouverte, sans charger l’environnement d’exécution complet du canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indications d’installation et de mise à jour pour les plugins intégrés et publiés en externe.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Chemin d’installation privilégié lorsque plusieurs sources d’installation sont disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Version minimale prise en charge de l’hôte OpenClaw, à l’aide d’une version semver minimale telle que `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Plage minimale de l’API de plugin OpenClaw requise par ce package, à l’aide d’une version semver minimale telle que `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Chaîne d’intégrité npm attendue, telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à celle-ci.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Autorise un chemin de récupération limité pour la réinstallation d’un plugin intégré lorsque la configuration n’est pas valide.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de packages npm qui doivent être matérialisés lorsque leurs contraintes de plateforme dans le fichier de verrouillage correspondent à l’hôte actuel.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permet aux surfaces de canal de l’environnement d’exécution de configuration de se charger avant la mise en écoute, puis diffère le plugin de canal entièrement configuré jusqu’à son activation après la mise en écoute.                                                 |

Les métadonnées du manifeste déterminent les choix de fournisseur, de canal et de configuration qui apparaissent pendant l’intégration avant le chargement de l’environnement d’exécution. `package.json#openclaw.install` indique au processus d’intégration comment récupérer ou activer ce plugin lorsque l’utilisateur sélectionne l’un de ces choix. Ne déplacez pas les indications d’installation vers `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre des manifestes pour les sources de plugins non intégrées. Les valeurs non valides sont rejetées ; les valeurs plus récentes mais valides entraînent l’omission des plugins externes sur les hôtes plus anciens. Les plugins sources intégrés sont supposés avoir la même version que le dépôt de travail de l’hôte.

`openclaw.install.requiredPlatformPackages` est destiné aux packages npm qui exposent les binaires natifs requis par l’intermédiaire d’alias facultatifs propres à chaque plateforme. Indiquez le nom nu du package npm pour chaque alias de plateforme pris en charge. Pendant l’installation npm, OpenClaw vérifie uniquement l’alias déclaré dont les contraintes du fichier de verrouillage correspondent à l’hôte actuel. Si npm signale une réussite mais omet cet alias, OpenClaw réessaie une fois avec un nouveau cache et annule l’installation si l’alias est toujours absent.

`openclaw.compat.pluginApi` est appliqué pendant l’installation du package pour les sources de plugins non intégrées. Utilisez-le pour indiquer la version minimale de l’API du SDK/de l’environnement d’exécution du plugin OpenClaw avec laquelle le package a été compilé. Il peut être plus strict que `minHostVersion` lorsqu’un package de plugin nécessite une API plus récente, tout en conservant une indication d’installation inférieure pour les autres flux. Par défaut, la synchronisation des versions officielles d’OpenClaw relève les versions minimales existantes de l’API des plugins officiels à la version d’OpenClaw, mais les versions propres aux plugins peuvent conserver une version minimale inférieure lorsque le package prend intentionnellement en charge des hôtes plus anciens. N’utilisez pas uniquement la version du package comme contrat de compatibilité. `peerDependencies.openclaw` reste une métadonnée du package npm ; OpenClaw utilise le contrat `openclaw.compat.pluginApi` pour les décisions de compatibilité d’installation.

Les métadonnées officielles d’installation à la demande doivent utiliser `clawhubSpec` lorsque le plugin est publié sur ClawHub ; le processus d’intégration considère alors ClawHub comme la source distante privilégiée et enregistre les informations sur l’artefact ClawHub après l’installation. `npmSpec` reste la solution de repli de compatibilité pour les packages qui n’ont pas encore migré vers ClawHub.

L’épinglage exact de la version npm se trouve déjà dans `npmSpec`, par exemple `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles du catalogue externe doivent associer les spécifications exactes à `expectedIntegrity` afin que les flux de mise à jour échouent de manière fermée si l’artefact npm récupéré ne correspond plus à la version épinglée. Pour assurer la compatibilité, l’intégration interactive continue de proposer des spécifications npm issues de registres approuvés, notamment des noms de packages nus et des balises de distribution. Les diagnostics du catalogue peuvent distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, présentant une incompatibilité de nom de package ou un choix par défaut non valide. Ils avertissent également lorsque `expectedIntegrity` est présent, mais qu’aucune source npm valide ne peut être épinglée. Lorsque `expectedIntegrity` est présent, les flux d’installation et de mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est enregistrée sans épinglage d’intégrité.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque les analyses d’état, de liste des canaux ou de SecretRef doivent identifier les comptes configurés sans charger l’environnement d’exécution complet. Le point d’entrée de configuration doit exposer les métadonnées du canal, ainsi que les adaptateurs de configuration, d’état et de secrets pouvant être utilisés sans risque pendant la configuration ; conservez les clients réseau, les processus d’écoute du Gateway et les environnements d’exécution de transport dans le point d’entrée principal de l’extension.

Les champs des points d’entrée d’exécution ne remplacent pas les vérifications des limites du package pour les champs des points d’entrée sources. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un chemin `openclaw.extensions` qui sort du package.

`openclaw.install.allowInvalidConfigRecovery` est volontairement limité. Il ne rend pas installables les configurations arbitrairement défectueuses. Actuellement, il permet uniquement aux flux d’installation de récupérer après certaines défaillances obsolètes de mise à niveau d’un plugin intégré, telles que l’absence du chemin d’un plugin intégré ou une entrée `channels.<id>` obsolète pour ce même plugin intégré. Les erreurs de configuration sans rapport bloquent toujours l’installation et orientent les opérateurs vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un module de vérification minimal :

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

Utilisez-la lorsque les flux de configuration, de diagnostic, d’état ou de présence en lecture seule nécessitent une vérification d’authentification oui/non peu coûteuse avant le chargement complet du plugin de canal. L’état d’authentification persistant n’est pas l’état configuré du canal : n’utilisez pas ces métadonnées pour activer automatiquement des plugins, réparer les dépendances d’exécution ou décider si l’environnement d’exécution d’un canal doit être chargé. L’exportation cible doit être une petite fonction qui lit uniquement l’état persistant ; ne la faites pas transiter par le barrel complet de l’environnement d’exécution du canal.

`openclaw.channel.configuredState` prend en charge les vérifications peu coûteuses de la configuration. Préférez les métadonnées déclaratives d’environnement lorsque les variables d’environnement suffisent :

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

Utilisez `env.allOf` lorsque toutes les variables répertoriées sont requises et `env.anyOf` lorsqu’une seule variable non vide suffit. Si une vérification minimale ne relevant pas de l’environnement d’exécution nécessite davantage que les métadonnées d’environnement, utilisez `specifier` avec `exportName`, comme illustré pour `persistedAuthState` ; lorsque `env` est présent, OpenClaw l’utilise sans charger ce module. Si la vérification nécessite une résolution complète de la configuration ou le véritable environnement d’exécution du canal, conservez cette logique dans le hook `config.hasConfiguredState` du plugin.

## Ordre de priorité de la découverte (identifiants de plugins en double)

OpenClaw découvre les plugins à partir de trois racines, vérifiées dans cet ordre : les plugins intégrés fournis avec OpenClaw, la racine d’installation globale (`~/.openclaw/extensions`) et la racine de l’espace de travail actuel (`<workspace>/.openclaw/extensions`), ainsi que toutes les entrées `plugins.load.paths` explicites.

Si deux éléments découverts partagent le même `id`, seul le manifeste de **plus haute priorité** est conservé ; les doublons de priorité inférieure sont ignorés au lieu d’être chargés à ses côtés. Ordre de priorité, du plus élevé au plus faible :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Installation globale correspondant à un enregistrement d’installation suivi** — un plugin installé par l’intermédiaire de `openclaw plugin install`/`openclaw plugin update` que le suivi des installations d’OpenClaw reconnaît pour ce même identifiant, même lorsque cet identifiant appartient également à un plugin intégré
3. **Intégré** — plugins fournis avec OpenClaw
4. **Espace de travail** — plugins découverts relativement à l’espace de travail actuel
5. Tout autre candidat découvert

Conséquences :

- Une copie dérivée ou obsolète d’un plugin intégré, non suivie et présente dans l’espace de travail ou la racine globale, ne remplace pas la version intégrée.
- Pour remplacer un plugin intégré, exécutez `openclaw plugin install` pour cet identifiant afin que l’installation globale suivie soit prioritaire sur la copie intégrée, ou épinglez un chemin précis avec `plugins.entries.<id>` afin qu’il l’emporte grâce à la priorité des éléments sélectionnés par la configuration.
- Les doublons ignorés sont journalisés afin que Doctor et les diagnostics de démarrage puissent indiquer la copie écartée.
- Dans les diagnostics, les remplacements de doublons sélectionnés par la configuration sont présentés comme des remplacements explicites, mais génèrent tout de même un avertissement afin que les dérivations obsolètes et les masquages accidentels restent visibles.

## Exigences relatives au schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés lors de la lecture ou de l’écriture de la configuration, et non à l’exécution.
- Lors de l’extension ou de la création d’un fork d’un plugin intégré avec de nouvelles clés de configuration, mettez également à jour les `openclaw.plugin.json` `configSchema` de ce plugin. Les schémas des plugins intégrés sont stricts : l’ajout de `plugins.entries.<id>.config.myNewKey` dans la configuration utilisateur sans ajouter `myNewKey` à `configSchema.properties` sera donc rejeté avant le chargement de l’environnement d’exécution du plugin.

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

## Comportement de la validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’identifiant du canal est déclaré par le manifeste d’un plugin. Si le même identifiant apparaît également dans `plugins.allow`, `plugins.entries` ou `plugins.installs` (un plugin référencé, mais actuellement introuvable), OpenClaw rétrograde plutôt le problème en **avertissement**.
- Les entrées `plugins.entries.<id>`, `plugins.allow` et `plugins.deny` qui font référence à des identifiants de plugins inconnus sont des **avertissements** (« entrée de configuration obsolète ignorée »), et non des erreurs, afin que les mises à niveau et les plugins supprimés ou renommés n’empêchent pas le démarrage du Gateway.
- Une entrée `plugins.slots.memory` faisant référence à un identifiant de plugin inconnu est une **erreur**, sauf pour le plugin externe officiel connu `memory-lancedb`, qui génère plutôt un avertissement.
- Si un plugin est installé, mais que son manifeste ou son schéma est défectueux ou manquant, la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe, mais que le plugin est **désactivé**, la configuration est conservée et un **avertissement** est affiché dans Doctor et les journaux.

Consultez la [référence de configuration](/fr/gateway/configuration) pour obtenir le schéma `plugins.*` complet.

## Remarques

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris ceux chargés depuis le système de fichiers local. L’environnement d’exécution charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte et à la validation.
- Les manifestes natifs sont analysés avec JSON5 : les commentaires, les virgules finales et les clés sans guillemets sont donc acceptés, à condition que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifestes. Évitez les clés personnalisées de premier niveau.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerCatalogEntry` doit rester léger et ne doit pas importer de larges portions du code d’exécution ; utilisez-le pour les métadonnées statiques du catalogue de fournisseurs ou pour des descripteurs de découverte ciblés, et non pour l’exécution lors du traitement des requêtes.
- Les types de plugins exclusifs sont sélectionnés par l’intermédiaire de `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory` (valeur par défaut : `memory-core`), `kind: "context-engine"` via `plugins.slots.contextEngine` (valeur par défaut : `legacy`).
- Déclarez le type de plugin exclusif dans ce manifeste. L’entrée d’exécution `OpenClawPluginDefinition.kind` est obsolète et n’est conservée que comme solution de repli de compatibilité pour les anciens plugins.
- Les métadonnées des variables d’environnement (`setup.providers[].envVars`, l’ancienne `providerAuthEnvVars` et `channelEnvVars`) sont uniquement déclaratives. L’état, l’audit, la validation de la remise Cron et les autres surfaces en lecture seule appliquent toujours la politique de confiance du plugin et sa politique d’activation effective avant de considérer une variable d’environnement comme configurée.
- Pour les métadonnées d’assistant d’exécution qui nécessitent le code du fournisseur, consultez les [hooks d’exécution des fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de compilation ainsi que les éventuelles exigences de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Ressources connexes

<CardGroup cols={3}>
  <Card title="Création de plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Premiers pas avec les plugins.
  </Card>
  <Card title="Architecture des plugins" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="Présentation du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK de plugin et importations de sous-chemins.
  </Card>
</CardGroup>
