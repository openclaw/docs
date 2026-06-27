---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez publier un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Exigences relatives au manifeste de Plugin et au schéma JSON (validation stricte de la configuration)
title: Manifeste de Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

Cette page concerne uniquement le **manifeste natif de Plugin OpenClaw**.

Pour les dispositions de bundles compatibles, consultez [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte également automatiquement ces dispositions de bundles, mais elles ne sont pas validées
avec le schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les racines
de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes du runtime OpenClaw.

Chaque Plugin OpenClaw natif **doit** inclure un fichier `openclaw.plugin.json` à la
**racine du Plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du Plugin**. Les manifestes manquants ou invalides sont traités comme des
erreurs de Plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de Plugin : [Plugins](/fr/tools/plugin).
Pour le modèle de capacité natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacité](/fr/plugins/architecture#public-capability-model).

## Ce que fait ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit **avant de charger votre
code de Plugin**. Tout ce qui suit doit être suffisamment léger pour être inspecté sans démarrer
le runtime du Plugin.

**Utilisez-le pour :**

- l’identité du Plugin, la validation de configuration et les indications d’interface de configuration
- les métadonnées d’authentification, d’onboarding et de configuration initiale (alias, activation automatique, variables d’environnement de fournisseur, choix d’authentification)
- les indications d’activation pour les surfaces du plan de contrôle
- la propriété abrégée des familles de modèles
- les instantanés statiques de propriété des capacités (`contracts`)
- les métadonnées du lanceur QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration propres aux canaux, fusionnées dans les surfaces de catalogue et de validation

**Ne l’utilisez pas pour :** enregistrer un comportement runtime, déclarer des points d’entrée de code,
ou des métadonnées d’installation npm. Ces éléments appartiennent au code de votre Plugin et à `package.json`.

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

| Champ                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                                                  |
| ------------------------------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | ID canonique du Plugin. Il s'agit de l'ID utilisé dans `plugins.entries.<id>`.                                                                                                                                                                  |
| `configSchema`                       | Oui         | `object`                         | JSON Schema intégré pour la configuration de ce Plugin.                                                                                                                                                                                        |
| `requiresPlugins`                    | Non         | `string[]`                       | IDs de Plugins qui doivent également être installés pour que ce Plugin ait un effet. La découverte garde le Plugin chargeable, mais avertit lorsqu'un Plugin requis est manquant.                                                              |
| `enabledByDefault`                   | Non         | `true`                           | Marque un Plugin groupé comme activé par défaut. Omettez-le, ou définissez n'importe quelle valeur autre que `true`, pour laisser le Plugin désactivé par défaut.                                                                               |
| `enabledByDefaultOnPlatforms`        | Non         | `string[]`                       | Marque un Plugin groupé comme activé par défaut uniquement sur les plateformes Node.js listées, par exemple `["darwin"]`. La configuration explicite reste prioritaire.                                                                        |
| `legacyPluginIds`                    | Non         | `string[]`                       | IDs hérités qui se normalisent vers cet ID canonique de Plugin.                                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | IDs de fournisseurs qui doivent activer automatiquement ce Plugin lorsque l'authentification, la configuration ou les références de modèle les mentionnent.                                                                                     |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de Plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                              |
| `channels`                           | Non         | `string[]`                       | IDs de canaux détenus par ce Plugin. Utilisé pour la découverte et la validation de configuration.                                                                                                                                              |
| `providers`                          | Non         | `string[]`                       | IDs de fournisseurs détenus par ce Plugin.                                                                                                                                                                                                     |
| `providerCatalogEntry`               | Non         | `string`                         | Chemin de module léger du catalogue de fournisseurs, relatif à la racine du Plugin, pour les métadonnées de catalogue de fournisseurs limitées au manifeste pouvant être chargées sans activer l'exécution complète du Plugin.                  |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées de famille de modèles détenues par le manifeste, utilisées pour charger automatiquement le Plugin avant l'exécution.                                                                                                      |
| `modelCatalog`                       | Non         | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs détenus par ce Plugin. Il s'agit du contrat de plan de contrôle pour les futures listes en lecture seule, l'onboarding, les sélecteurs de modèles, les alias et la suppression sans charger l'exécution du Plugin. |
| `modelPricing`                       | Non         | `object`                         | Politique de recherche de tarifs externes détenue par le fournisseur. Utilisez-la pour exclure les fournisseurs locaux/auto-hébergés des catalogues de tarifs distants ou mapper les références de fournisseurs vers les IDs de catalogue OpenRouter/LiteLLM sans coder en dur les IDs de fournisseurs dans le cœur. |
| `modelIdNormalization`               | Non         | `object`                         | Nettoyage des alias/préfixes d'ID de modèle détenu par le fournisseur, qui doit s'exécuter avant le chargement de l'exécution du fournisseur.                                                                                                  |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d'hôte/`baseUrl` de points de terminaison détenues par le manifeste pour les routes de fournisseurs que le cœur doit classer avant le chargement de l'exécution du fournisseur.                                                     |
| `providerRequest`                    | Non         | `object`                         | Métadonnées légères de famille de fournisseurs et de compatibilité des requêtes, utilisées par la politique générique de requête avant le chargement de l'exécution du fournisseur.                                                             |
| `secretProviderIntegrations`         | Non         | `Record<string, object>`         | Préréglages déclaratifs de fournisseurs exec SecretRef que les surfaces de configuration ou d'installation peuvent proposer sans coder en dur les intégrations propres aux fournisseurs dans le cœur.                                           |
| `cliBackends`                        | Non         | `string[]`                       | IDs de backends d'inférence CLI détenus par ce Plugin. Utilisé pour l'auto-activation au démarrage à partir de références de configuration explicites.                                                                                         |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d'authentification synthétique détenu par le Plugin doit être sondé pendant la découverte à froid des modèles avant le chargement de l'exécution.                                      |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs de clés d'API de substitution détenues par un Plugin groupé, représentant un état d'identifiants non secrets locaux, OAuth ou ambiants.                                                                                                |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes détenus par ce Plugin qui doivent produire des diagnostics de configuration et de CLI sensibles au Plugin avant le chargement de l'exécution.                                                                                 |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées d'environnement de compatibilité obsolètes pour la recherche d'authentification/de statut du fournisseur. Préférez `setup.providers[].envVars` pour les nouveaux Plugins ; OpenClaw les lit encore pendant la fenêtre de dépréciation. |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | IDs de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d'authentification, par exemple un fournisseur de codage qui partage la clé d'API et les profils d'authentification du fournisseur de base.             |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées légères d'environnement de canal qu'OpenClaw peut inspecter sans charger le code du Plugin. Utilisez-les pour les surfaces de configuration ou d'authentification de canal pilotées par l'environnement que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d'authentification pour les sélecteurs d'onboarding, la résolution du fournisseur préféré et le câblage simple des flags CLI.                                                                                     |
| `activation`                         | Non         | `object`                         | Métadonnées légères du planificateur d'activation pour le chargement déclenché par le démarrage, le fournisseur, la commande, le canal, la route et les capacités. Métadonnées uniquement ; l'exécution du Plugin possède toujours le comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger l'exécution du Plugin.                                                                                       |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers d'exécuteurs QA utilisés par l'hôte partagé `openclaw qa` avant le chargement de l'exécution du Plugin.                                                                                                                    |
| `contracts`                          | Non         | `object`                         | Instantané statique de possession des capacités pour les hooks d'authentification externes, les embeddings, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d'images, la génération de musique, la génération de vidéos, la récupération web, la recherche web et la possession d'outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les IDs de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                                     |
| `imageGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d'authentification de génération d'images pour les IDs de fournisseurs déclarés dans `contracts.imageGenerationProviders`, y compris les alias d'authentification détenus par le fournisseur et les protections d'URL de base. |
| `videoGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d'authentification de génération de vidéos pour les IDs de fournisseurs déclarés dans `contracts.videoGenerationProviders`, y compris les alias d'authentification détenus par le fournisseur et les protections d'URL de base. |
| `musicGenerationProviderMetadata`    | Non         | `Record<string, object>`         | Métadonnées légères d'authentification de génération de musique pour les IDs de fournisseurs déclarés dans `contracts.musicGenerationProviders`, y compris les alias d'authentification détenus par le fournisseur et les protections d'URL de base. |
| `toolMetadata`                       | Non      | `Record<string, object>`         | Métadonnées de disponibilité légères pour les outils détenus par le plugin déclarés dans `contracts.tools`. Utilisez-les lorsqu’un outil ne doit pas charger le runtime sauf si des preuves de config, d’environnement ou d’authentification existent.                                                                       |
| `channelConfigs`                     | Non      | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                                                                                      |
| `skills`                             | Non      | `string[]`                       | Répertoires de Skill à charger, relatifs à la racine du plugin.                                                                                                                                                                                         |
| `name`                               | Non      | `string`                         | Nom du plugin lisible par l’humain.                                                                                                                                                                                                                     |
| `description`                        | Non      | `string`                         | Court résumé affiché dans les surfaces de plugin.                                                                                                                                                                                                         |
| `icon`                               | Non      | `string`                         | URL d’image HTTPS pour les cartes de place de marché/catalogue. ClawHub accepte toute URL `https://` valide et revient à l’icône de plugin par défaut lorsque ce champ est omis ou invalide.                                                                              |
| `version`                            | Non      | `string`                         | Version informative du plugin.                                                                                                                                                                                                                   |
| `uiHints`                            | Non      | `Record<string, object>`         | Libellés d’interface utilisateur, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                                                                                                               |

## Référence des métadonnées de fournisseur de génération

Les champs de métadonnées de fournisseur de génération décrivent des signaux d’authentification statiques pour les fournisseurs déclarés dans la liste `contracts.*GenerationProviders` correspondante.
OpenClaw lit ces champs avant le chargement de l’exécution du fournisseur afin que les outils du cœur puissent décider si un fournisseur de génération est disponible sans importer chaque Plugin de fournisseur.

Utilisez ces champs uniquement pour des faits déclaratifs peu coûteux. Le transport, les transformations de requêtes, le rafraîchissement de jetons, la validation des identifiants et le comportement de génération réel restent dans l’exécution du Plugin.

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

| Champ                  | Obligatoire | Type       | Signification                                                                                                                                       |
| ---------------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | Non         | `string[]` | Identifiants de fournisseur supplémentaires qui doivent compter comme alias d’authentification statiques pour le fournisseur de génération.                                                       |
| `authProviders`        | Non         | `string[]` | Identifiants de fournisseur dont les profils d’authentification configurés doivent compter comme authentification pour ce fournisseur de génération.                                                      |
| `configSignals`        | Non         | `object[]` | Signaux de disponibilité peu coûteux, basés uniquement sur la configuration, pour les fournisseurs locaux ou auto-hébergés qui peuvent être configurés sans profils d’authentification ni variables d’environnement.                 |
| `authSignals`          | Non         | `object[]` | Signaux d’authentification explicites. Lorsqu’ils sont présents, ils remplacent l’ensemble de signaux par défaut provenant de l’identifiant du fournisseur, de `aliases` et de `authProviders`.                     |
| `referenceAudioInputs` | Non         | `boolean`  | Génération vidéo uniquement. Définissez sur `true` lorsque le fournisseur accepte les ressources audio de référence ; sinon, `video_generate` masque les paramètres de référence audio. |

Chaque entrée `configSignals` prend en charge :

| Champ            | Obligatoire | Type       | Signification                                                                                                                                                                             |
| ---------------- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | Oui         | `string`   | Chemin en notation pointée vers l’objet de configuration détenu par le Plugin à inspecter, par exemple `plugins.entries.example.config`.                                                                                      |
| `overlayPath`    | Non         | `string`   | Chemin en notation pointée à l’intérieur de la configuration racine dont l’objet doit se superposer à l’objet racine avant d’évaluer le signal. Utilisez-le pour une configuration propre à une capacité, comme `image`, `video` ou `music`.   |
| `overlayMapPath` | Non         | `string`   | Chemin en notation pointée à l’intérieur de la configuration racine dont chaque valeur d’objet doit se superposer à l’objet racine. Utilisez-le pour des cartes de comptes nommés comme `accounts`, où tout compte configuré doit être admissible. |
| `required`       | Non         | `string[]` | Chemins en notation pointée à l’intérieur de la configuration effective qui doivent avoir des valeurs configurées. Les chaînes doivent être non vides ; les objets et les tableaux ne doivent pas être vides.                                                  |
| `requiredAny`    | Non         | `string[]` | Chemins en notation pointée à l’intérieur de la configuration effective dont au moins un doit avoir une valeur configurée.                                                                                                    |
| `mode`           | Non         | `object`   | Garde de mode chaîne facultative à l’intérieur de la configuration effective. Utilisez-la lorsque la disponibilité basée uniquement sur la configuration ne s’applique qu’à un seul mode.                                                                  |

Chaque garde `mode` prend en charge :

| Champ        | Obligatoire | Type       | Signification                                                                      |
| ------------ | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | Non         | `string`   | Chemin en notation pointée à l’intérieur de la configuration effective. Valeur par défaut : `mode`.                          |
| `default`    | Non         | `string`   | Valeur de mode à utiliser lorsque la configuration omet le chemin.                                  |
| `allowed`    | Non         | `string[]` | S’il est présent, le signal réussit uniquement lorsque le mode effectif est l’une de ces valeurs. |
| `disallowed` | Non         | `string[]` | S’il est présent, le signal échoue lorsque le mode effectif est l’une de ces valeurs.       |

Chaque entrée `authSignals` prend en charge :

| Champ             | Obligatoire | Type     | Signification                                                                                                                                                                 |
| ----------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui         | `string` | Identifiant de fournisseur à vérifier dans les profils d’authentification configurés.                                                                                                                             |
| `providerBaseUrl` | Non         | `object` | Garde facultative qui fait compter le signal uniquement lorsque le fournisseur configuré référencé utilise une URL de base autorisée. Utilisez-la lorsqu’un alias d’authentification n’est valide que pour certaines API. |

Chaque garde `providerBaseUrl` prend en charge :

| Champ             | Obligatoire | Type       | Signification                                                                                                                                        |
| ----------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | Oui         | `string`   | Identifiant de configuration de fournisseur dont `baseUrl` doit être vérifiée.                                                                                                |
| `defaultBaseUrl`  | Non         | `string`   | URL de base à supposer lorsque la configuration du fournisseur omet `baseUrl`.                                                                                         |
| `allowedBaseUrls` | Oui         | `string[]` | URL de base autorisées pour ce signal d’authentification. Le signal est ignoré lorsque l’URL de base configurée ou par défaut ne correspond à aucune de ces valeurs normalisées. |

## Référence des métadonnées d’outil

`toolMetadata` utilise les mêmes formes `configSignals` et `authSignals` que les métadonnées de fournisseur de génération, indexées par nom d’outil. `contracts.tools` déclare la propriété. `toolMetadata` déclare des preuves de disponibilité peu coûteuses afin qu’OpenClaw puisse éviter d’importer l’exécution d’un Plugin uniquement pour que sa fabrique d’outils retourne `null`.

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

Si un outil n’a pas de `toolMetadata`, OpenClaw conserve le comportement existant et charge le Plugin propriétaire lorsque le contrat d’outil correspond à la politique. Pour les outils des chemins critiques dont la fabrique dépend de l’authentification ou de la configuration, les auteurs de Plugin doivent déclarer `toolMetadata` au lieu de faire importer l’exécution au cœur pour l’interroger.

## Référence providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’intégration ou d’authentification.
OpenClaw lit ceci avant le chargement de l’exécution du fournisseur.
Les listes de configuration de fournisseur utilisent ces choix de manifeste, les choix de configuration dérivés des descripteurs et les métadonnées du catalogue d’installation sans charger l’exécution du fournisseur.

| Champ                 | Obligatoire | Type                                                                  | Signification                                                                                                                 |
| --------------------- | ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                                              | Identifiant du fournisseur auquel ce choix appartient.                                                                         |
| `method`              | Oui         | `string`                                                              | Identifiant de la méthode d’authentification vers laquelle répartir.                                                           |
| `choiceId`            | Oui         | `string`                                                              | Identifiant stable du choix d’authentification utilisé par les flux d’onboarding et de CLI.                                   |
| `choiceLabel`         | Non         | `string`                                                              | Libellé visible par l’utilisateur. S’il est omis, OpenClaw se rabat sur `choiceId`.                                           |
| `choiceHint`          | Non         | `string`                                                              | Court texte d’aide pour le sélecteur.                                                                                         |
| `assistantPriority`   | Non         | `number`                                                              | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant.                        |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                                        | Masque le choix dans les sélecteurs de l’assistant tout en autorisant encore la sélection manuelle via la CLI.                 |
| `deprecatedChoiceIds` | Non         | `string[]`                                                            | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement.                           |
| `groupId`             | Non         | `string`                                                              | Identifiant de groupe facultatif pour regrouper des choix liés.                                                               |
| `groupLabel`          | Non         | `string`                                                              | Libellé visible par l’utilisateur pour ce groupe.                                                                              |
| `groupHint`           | Non         | `string`                                                              | Court texte d’aide pour le groupe.                                                                                            |
| `optionKey`           | Non         | `string`                                                              | Clé d’option interne pour les flux d’authentification simples à un seul indicateur.                                           |
| `cliFlag`             | Non         | `string`                                                              | Nom d’indicateur CLI, comme `--openrouter-api-key`.                                                                            |
| `cliOption`           | Non         | `string`                                                              | Forme complète de l’option CLI, comme `--openrouter-api-key <key>`.                                                           |
| `cliDescription`      | Non         | `string`                                                              | Description utilisée dans l’aide de la CLI.                                                                                   |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation" \| "music-generation">` | Surfaces d’onboarding dans lesquelles ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence de commandAliases

Utilisez `commandAliases` lorsqu’un Plugin possède un nom de commande d’exécution que les utilisateurs peuvent
placer par erreur dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code d’exécution du Plugin.

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

| Champ        | Obligatoire | Type              | Signification                                                                 |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce Plugin.                                   |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme commande slash de chat plutôt que commande CLI racine.   |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, le cas échéant. |

## Référence d’activation

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/de chargement.

Ce bloc est constitué de métadonnées de planification, pas d’une API de cycle de vie. Il n’enregistre pas
de comportement d’exécution, ne remplace pas `register(...)` et ne garantit pas que
le code du Plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
réduire les Plugins candidats avant de se rabattre sur les métadonnées existantes de propriété du manifeste
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez les métadonnées les plus étroites qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour les indications supplémentaires du planificateur
qui ne peuvent pas être représentées par ces champs de propriété.
Utilisez `cliBackends` de premier niveau pour les alias d’exécution CLI comme `claude-cli`,
`my-cli` ou `google-gemini-cli`; `activation.onAgentHarnesses` est réservé aux
identifiants de harnais d’agents intégrés qui ne disposent pas déjà d’un champ de propriété.

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement d’exécution et ne
remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée d’exécution/de Plugin.
Les consommateurs actuels l’utilisent comme indication de réduction avant un chargement plus large des Plugins, donc
l’absence de métadonnées d’activation hors démarrage ne coûte généralement que des performances ; elle
ne doit pas modifier la correction tant que les replis de propriété du manifeste existent encore.

Chaque Plugin doit définir `activation.onStartup` intentionnellement. Définissez-le sur `true`
uniquement lorsque le Plugin doit s’exécuter pendant le démarrage du Gateway. Définissez-le sur `false` lorsque
le Plugin est inerte au démarrage et ne doit se charger qu’à partir de déclencheurs plus étroits.
Omettre `onStartup` ne charge plus implicitement le Plugin au démarrage ; utilisez des
métadonnées d’activation explicites pour le démarrage, les canaux, la configuration, le harnais d’agent, la mémoire ou
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

| Champ              | Obligatoire | Type                                                 | Signification                                                                                                                                                                                   |
| ------------------ | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Non         | `boolean`                                            | Activation explicite au démarrage du Gateway. Chaque Plugin doit définir ce champ. `true` importe le Plugin pendant le démarrage ; `false` le garde paresseux au démarrage sauf si un autre déclencheur correspondant impose son chargement. |
| `onProviders`      | Non         | `string[]`                                           | Identifiants de fournisseurs qui doivent inclure ce Plugin dans les plans d’activation/de chargement.                                                                                           |
| `onAgentHarnesses` | Non         | `string[]`                                           | Identifiants d’exécution de harnais d’agents intégrés qui doivent inclure ce Plugin dans les plans d’activation/de chargement. Utilisez `cliBackends` de premier niveau pour les alias de backend CLI. |
| `onCommands`       | Non         | `string[]`                                           | Identifiants de commandes qui doivent inclure ce Plugin dans les plans d’activation/de chargement.                                                                                              |
| `onChannels`       | Non         | `string[]`                                           | Identifiants de canaux qui doivent inclure ce Plugin dans les plans d’activation/de chargement.                                                                                                 |
| `onRoutes`         | Non         | `string[]`                                           | Types de routes qui doivent inclure ce Plugin dans les plans d’activation/de chargement.                                                                                                        |
| `onConfigPaths`    | Non         | `string[]`                                           | Chemins de configuration relatifs à la racine qui doivent inclure ce Plugin dans les plans de démarrage/de chargement lorsque le chemin est présent et n’est pas explicitement désactivé.        |
| `onCapabilities`   | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications générales de capacités utilisées par la planification d’activation du plan de contrôle. Préférez des champs plus étroits lorsque c’est possible.                                    |

Consommateurs actifs actuels :

- La planification du démarrage du Gateway utilise `activation.onStartup` pour l’importation explicite au démarrage
- la planification CLI déclenchée par commande se rabat sur l’ancien
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification du démarrage de l’exécution d’agent utilise `activation.onAgentHarnesses` pour les
  harnais intégrés et `cliBackends[]` de premier niveau pour les alias d’exécution CLI
- la planification de configuration/de canal déclenchée par canal se rabat sur l’ancienne propriété `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification des Plugins au démarrage utilise `activation.onConfigPaths` pour les surfaces de configuration racine
  hors canal, comme le bloc `browser` du Plugin de navigateur groupé
- la planification de configuration/d’exécution déclenchée par fournisseur se rabat sur l’ancienne propriété
  `providers[]` et `cliBackends[]` de premier niveau lorsque les métadonnées explicites
  d’activation de fournisseur sont absentes

Les diagnostics du planificateur peuvent distinguer les indications d’activation explicites du repli sur la
propriété du manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` correspondait, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces libellés de raison sont destinés aux
diagnostics de l’hôte et aux tests ; les auteurs de Plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## Référence de qaRunners

Utilisez `qaRunners` lorsqu’un Plugin fournit un ou plusieurs exécuteurs de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; l’exécution du Plugin
possède toujours l’enregistrement CLI réel via une surface
`runtime-api.ts` légère qui exporte `qaRunnerCliRegistrations`.

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

| Champ         | Obligatoire | Type     | Signification                                                        |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.       |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande stub. |

## référence setup

Utilisez `setup` lorsque les surfaces de configuration initiale et d’onboarding ont besoin de métadonnées peu coûteuses propres au plugin
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

Le `cliBackends` de premier niveau reste valide et continue de décrire les backends
d’inférence CLI. `setup.cliBackends` est la surface de descripteur propre à la configuration initiale pour les
flux de plan de contrôle/configuration initiale qui doivent rester limités aux métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
à descripteur prioritaire préférée pour la découverte de configuration initiale. Si le descripteur ne fait que
restreindre le plugin candidat et que la configuration initiale a encore besoin de hooks runtime plus riches au moment de la configuration initiale,
définissez `requiresRuntime: true` et conservez `setup-api` en place comme
chemin d’exécution de repli.

OpenClaw inclut aussi `setup.providers[].envVars` dans les recherches génériques d’authentification de fournisseur et de
variables d’environnement. `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
pendant la fenêtre de dépréciation, mais les plugins non intégrés qui l’utilisent encore
reçoivent un diagnostic de manifeste. Les nouveaux plugins doivent placer les métadonnées d’environnement de configuration initiale/état
sur `setup.providers[].envVars`.

OpenClaw peut aussi déduire des choix simples de configuration initiale à partir de `setup.providers[].authMethods`
lorsqu’aucune entrée de configuration initiale n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que le runtime de configuration initiale est inutile. Les entrées explicites `providerAuthChoices` restent
préférées pour les libellés personnalisés, les indicateurs CLI, le périmètre d’onboarding et les métadonnées d’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs suffisent pour la
surface de configuration initiale. OpenClaw traite `false` explicite comme un contrat limité aux descripteurs
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche de configuration initiale. Si
un plugin limité aux descripteurs fournit encore l’une de ces entrées runtime de configuration initiale,
OpenClaw signale un diagnostic additif et continue de l’ignorer. L’omission de
`requiresRuntime` conserve le comportement de repli hérité afin que les plugins existants qui ont ajouté
des descripteurs sans l’indicateur ne soient pas cassés.

Comme la recherche de configuration initiale peut exécuter du code `setup-api` propre au plugin, les valeurs
normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les
plugins découverts. Une propriété ambiguë échoue de façon fermée au lieu de choisir un
gagnant selon l’ordre de découverte.

Lorsque le runtime de configuration initiale s’exécute, les diagnostics du registre de configuration initiale signalent une dérive de descripteur
si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs de manifeste
ne déclarent pas, ou si un descripteur n’a aucun enregistrement runtime
correspondant. Ces diagnostics sont additifs et ne rejettent pas les plugins hérités.

### référence setup.providers

| Champ          | Obligatoire | Type       | Signification                                                                                      |
| -------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | Oui         | `string`   | Id de fournisseur exposé pendant la configuration initiale ou l’onboarding. Gardez les ids normalisés globalement uniques. |
| `authMethods`  | Non         | `string[]` | Ids de méthodes de configuration initiale/authentification que ce fournisseur prend en charge sans charger tout le runtime. |
| `envVars`      | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration initiale/état peuvent vérifier avant le chargement du runtime du plugin. |
| `authEvidence` | Non         | `object[]` | Vérifications peu coûteuses de preuve d’authentification locale pour les fournisseurs qui peuvent s’authentifier via des marqueurs non secrets. |

`authEvidence` est destiné aux marqueurs d’identifiants locaux propres au fournisseur qui peuvent être
vérifiés sans charger de code runtime. Ces vérifications doivent rester peu coûteuses et locales :
aucun appel réseau, aucune lecture de trousseau ou de gestionnaire de secrets, aucune commande shell, et aucune
sonde d’API fournisseur.

Entrées de preuve prises en charge :

| Champ              | Obligatoire | Type       | Signification                                                                                                    |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`             | Oui         | `string`   | Actuellement `local-file-with-env`.                                                                              |
| `fileEnvVar`       | Non         | `string`   | Variable d’environnement contenant un chemin explicite de fichier d’identifiants.                                 |
| `fallbackPaths`    | Non         | `string[]` | Chemins locaux de fichiers d’identifiants vérifiés lorsque `fileEnvVar` est absent ou vide. Prend en charge `${HOME}` et `${APPDATA}`. |
| `requiresAnyEnv`   | Non         | `string[]` | Au moins une variable d’environnement listée doit être non vide pour que la preuve soit valide.                  |
| `requiresAllEnv`   | Non         | `string[]` | Chaque variable d’environnement listée doit être non vide pour que la preuve soit valide.                        |
| `credentialMarker` | Oui         | `string`   | Marqueur non secret renvoyé lorsque la preuve est présente.                                                      |
| `source`           | Non         | `string`   | Libellé de source visible par l’utilisateur pour la sortie d’authentification/état.                              |

### champs setup

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration initiale de fournisseurs exposés pendant la configuration initiale et l’onboarding. |
| `cliBackends`      | Non         | `string[]` | Ids de backend au moment de la configuration initiale utilisés pour la recherche de configuration initiale à descripteur prioritaire. Gardez les ids normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | Ids de migration de configuration possédés par la surface de configuration initiale de ce plugin.    |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration initiale a encore besoin de l’exécution de `setup-api` après la recherche par descripteur. |

## référence uiHints

`uiHints` est une table de correspondance entre les noms de champs de configuration et de petites indications de rendu.

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
| `label`       | `string`   | Libellé de champ visible par l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                   |
| `tags`        | `string[]` | Tags d’interface utilisateur optionnels. |
| `advanced`    | `boolean`  | Marque le champ comme avancé.         |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les champs de formulaire. |

## référence contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu’OpenClaw peut
lire sans importer le runtime du plugin.

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
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est optionnelle :

| Champ                            | Type       | Signification                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Identifiants de fabriques d’extensions du serveur d’application Codex, actuellement `codex-app-server`.                              |
| `agentToolResultMiddleware`      | `string[]` | Identifiants de runtimes pour lesquels ce plugin peut enregistrer un middleware de résultat d’outil.                                  |
| `trustedToolPolicies`            | `string[]` | Identifiants de politiques pré-outil approuvées locales au plugin qu’un plugin installé peut enregistrer. Les plugins intégrés peuvent enregistrer des politiques sans ce champ. |
| `externalAuthProviders`          | `string[]` | Identifiants de fournisseurs dont ce plugin possède le hook de profil d’authentification externe.                                    |
| `embeddingProviders`             | `string[]` | Identifiants de fournisseurs d’embeddings généraux que ce plugin possède pour l’utilisation réutilisable d’embeddings vectoriels, y compris la mémoire. |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de parole que ce plugin possède.                                                                         |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription en temps réel que ce plugin possède.                                                    |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de voix en temps réel que ce plugin possède.                                                             |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants obsolètes de fournisseurs d’embeddings propres à la mémoire que ce plugin possède.                                      |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension des médias que ce plugin possède.                                                       |
| `transcriptSourceProviders`      | `string[]` | Identifiants de fournisseurs de sources de transcriptions que ce plugin possède.                                                      |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d’images que ce plugin possède.                                                            |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération vidéo que ce plugin possède.                                                               |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération web que ce plugin possède.                                                               |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche web que ce plugin possède.                                                                  |
| `migrationProviders`             | `string[]` | Identifiants de fournisseurs d’import que ce plugin possède pour `openclaw migrate`.                                                  |
| `gatewayMethodDispatch`          | `string[]` | Droit réservé aux routes HTTP de plugins authentifiés qui dispatchent des méthodes Gateway dans le processus.                         |
| `tools`                          | `string[]` | Noms d’outils d’agent que ce plugin possède.                                                                                          |

`contracts.embeddedExtensionFactories` est conservé pour les fabriques
d’extensions uniquement destinées au serveur d’application Codex intégré. Les
transformations intégrées de résultats d’outils doivent déclarer
`contracts.agentToolResultMiddleware` et s’enregistrer avec
`api.registerAgentToolResultMiddleware(...)` à la place. Les plugins installés
peuvent utiliser le même point de middleware uniquement lorsqu’il est
explicitement activé et uniquement pour les runtimes qu’ils déclarent dans
`contracts.agentToolResultMiddleware`.

Les plugins installés qui ont besoin du niveau de politique pré-outil approuvé
par l’hôte doivent déclarer chaque identifiant local enregistré dans
`contracts.trustedToolPolicies` et être explicitement activés. Les plugins
intégrés conservent le chemin de politique approuvée existant, mais les plugins
installés avec des identifiants de politique non déclarés sont rejetés avant
l’enregistrement. Les identifiants de politique sont limités au plugin qui les
enregistre, donc deux plugins peuvent tous deux déclarer et enregistrer
`workflow-budget`; un seul plugin ne peut pas enregistrer deux fois le même
identifiant local.

Les enregistrements runtime `api.registerTool(...)` doivent correspondre à
`contracts.tools`. La découverte des outils utilise cette liste pour charger
uniquement les runtimes de plugins pouvant posséder les outils demandés.

Les plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent
déclarer `contracts.externalAuthProviders`; les hooks d’authentification externe
non déclarés sont ignorés.

Les fournisseurs d’embeddings généraux doivent déclarer
`contracts.embeddingProviders` pour chaque adaptateur enregistré avec
`api.registerEmbeddingProvider(...)`. Utilisez le contrat général pour la
génération vectorielle réutilisable, y compris les fournisseurs consommés par la
recherche en mémoire. `contracts.memoryEmbeddingProviders` est une compatibilité
obsolète propre à la mémoire et reste uniquement pendant que les fournisseurs
existants migrent vers le point d’intégration générique des fournisseurs
d’embeddings.

`contracts.gatewayMethodDispatch` accepte actuellement
`"authenticated-request"`. C’est un garde-fou d’hygiène d’API pour les routes
HTTP natives de plugins qui dispatchent intentionnellement des méthodes du plan
de contrôle Gateway dans le processus, et non un bac à sable contre les plugins
natifs malveillants. Utilisez-le uniquement pour des surfaces intégrées ou
opérateur étroitement relues qui exigent déjà l’authentification HTTP Gateway.

## Référence mediaUnderstandingProviderMetadata

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de
compréhension des médias a des modèles par défaut, une priorité de fallback
d’authentification automatique ou une prise en charge native des documents dont
les helpers génériques du cœur ont besoin avant le chargement du runtime. Les
clés doivent également être déclarées dans
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

| Champ                  | Type                                | Signification                                                               |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                                |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la config ne précise pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus faibles sont triés plus tôt pour le fallback automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de documents natives prises en charge par le fournisseur.            |

## Référence channelConfigs

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de
config peu coûteuses avant le chargement du runtime. La découverte en lecture
seule de la configuration ou du statut du canal peut utiliser ces métadonnées
directement pour les canaux externes configurés lorsqu’aucune entrée de
configuration n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que le runtime de configuration est inutile.

`channelConfigs` est une métadonnée de manifeste de plugin, pas une nouvelle
section de config utilisateur de niveau supérieur. Les utilisateurs configurent
toujours les instances de canaux sous `channels.<channel-id>`. OpenClaw lit les
métadonnées du manifeste pour décider quel plugin possède ce canal configuré
avant l’exécution du code runtime du plugin.

Pour un plugin de canal, `configSchema` et `channelConfigs` décrivent des
chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les plugins non intégrés qui déclarent `channels[]` doivent aussi déclarer les
entrées `channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours
charger le plugin, mais les surfaces de schéma de config en chemin froid, de
configuration et de Control UI ne peuvent pas connaître la forme des options
possédées par le canal avant l’exécution du runtime du plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et
`nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut statiques
`auto` pour les vérifications de config de commandes qui s’exécutent avant le
chargement du runtime du canal. Les canaux intégrés peuvent aussi publier les
mêmes valeurs par défaut via `package.json#openclaw.channel.commands` avec leurs
autres métadonnées de catalogue de canaux appartenant au package.

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

| Champ         | Type                     | Signification                                                                            |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Requis pour chaque entrée de config de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés, placeholders et indications sensibles d’interface utilisateur facultatifs pour cette section de config de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.              |
| `commands`    | `object`                 | Valeurs par défaut automatiques statiques de commandes natives et de Skills natives pour les vérifications de config pré-runtime. |
| `preferOver`  | `string[]`               | Identifiants de plugins hérités ou de priorité inférieure que ce canal doit devancer dans les surfaces de sélection. |

### Remplacer un autre plugin de canal

Utilisez `preferOver` lorsque votre plugin est le propriétaire préféré d’un
identifiant de canal qu’un autre plugin peut également fournir. Les cas courants
sont un identifiant de plugin renommé, un plugin autonome qui remplace un plugin
intégré, ou un fork maintenu qui conserve le même identifiant de canal pour la
compatibilité de config.

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

Lorsque `channels.chat` est configuré, OpenClaw prend en compte à la fois
l’identifiant de canal et l’identifiant du plugin préféré. Si le plugin de
priorité inférieure a été sélectionné uniquement parce qu’il est intégré ou
activé par défaut, OpenClaw le désactive dans la config runtime effective afin
qu’un seul plugin possède le canal et ses outils. La sélection explicite de
l’utilisateur l’emporte toujours : si l’utilisateur active explicitement les
deux plugins, OpenClaw préserve ce choix et signale des diagnostics de doublons
de canal ou d’outil au lieu de modifier silencieusement l’ensemble de plugins
demandé.

Gardez `preferOver` limité aux identifiants de plugins qui peuvent réellement
fournir le même canal. Ce n’est pas un champ de priorité général et il ne
renomme pas les clés de config utilisateur.

## Référence modelSupport

Utilisez `modelSupport` quand OpenClaw doit déduire votre plugin de fournisseur à partir
d’identifiants de modèle abrégés comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement
du runtime du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` propriétaires
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un plugin non groupé et un plugin groupé correspondent tous les deux, le plugin non groupé
  l’emporte
- toute ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants de modèle abrégés.                 |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants de modèle abrégés après suppression du suffixe de profil. |

Les entrées `modelPatterns` sont compilées via `compileSafeRegex`, qui rejette
les motifs contenant une répétition imbriquée (par exemple `(a+)+$`). Les motifs qui échouent
au contrôle de sécurité sont ignorés silencieusement, comme les regex syntaxiquement invalides.
Gardez les motifs simples et évitez les quantificateurs imbriqués.

## Référence modelCatalog

Utilisez `modelCatalog` quand OpenClaw doit connaître les métadonnées de modèle du fournisseur avant
de charger le runtime du plugin. C’est la source détenue par le manifeste pour les lignes de catalogue
fixes, les alias de fournisseur, les règles de suppression et le mode de découverte. L’actualisation au runtime
reste dans le code de runtime du fournisseur, mais le manifeste indique au cœur quand le runtime
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

| Champ            | Type                                                     | Signification                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | Lignes de catalogue pour les identifiants de fournisseur détenus par ce plugin. Les clés doivent aussi apparaître dans `providers` au premier niveau.       |
| `aliases`        | `Record<string, object>`                                 | Alias de fournisseur qui doivent se résoudre vers un fournisseur détenu pour la planification de catalogue ou de suppression.              |
| `suppressions`   | `object[]`                                               | Lignes de modèle provenant d’une autre source que ce plugin supprime pour une raison propre au fournisseur.                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées du manifeste, actualisé dans le cache ou nécessite le runtime. |
| `runtimeAugment` | `boolean`                                                | Définissez sur `true` uniquement quand le runtime du fournisseur doit ajouter des lignes de catalogue après la planification du manifeste/de la configuration.       |

`aliases` participe à la recherche de propriété du fournisseur pour la planification du catalogue de modèles.
Les cibles d’alias doivent être des fournisseurs de premier niveau détenus par le même plugin. Quand une
liste filtrée par fournisseur utilise un alias, OpenClaw peut lire le manifeste propriétaire et
appliquer les remplacements d’API/de base URL de l’alias sans charger le runtime du fournisseur.
Les alias n’étendent pas les listes de catalogue non filtrées ; les listes larges émettent uniquement les lignes
du fournisseur canonique propriétaire.

`suppressions` remplace l’ancien hook de runtime fournisseur `suppressBuiltInModel`.
Les entrées de suppression sont honorées uniquement quand le fournisseur est détenu par le plugin ou
déclaré comme clé `modelCatalog.aliases` ciblant un fournisseur détenu. Les hooks de suppression
runtime ne sont plus appelés pendant la résolution de modèle.

Champs de fournisseur :

| Champ     | Type                     | Signification                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL par défaut optionnelle pour les modèles de ce catalogue de fournisseur.    |
| `api`     | `ModelApi`               | Adaptateur d’API par défaut optionnel pour les modèles de ce catalogue de fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques optionnels qui s’appliquent à ce catalogue de fournisseur.      |
| `models`  | `object[]`               | Lignes de modèle requises. Les lignes sans `id` sont ignorées.            |

Champs de modèle :

| Champ           | Type                                                           | Signification                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Identifiant de modèle local au fournisseur, sans le préfixe `provider/`.                    |
| `name`          | `string`                                                       | Nom d’affichage optionnel.                                                      |
| `api`           | `ModelApi`                                                     | Remplacement d’API optionnel par modèle.                                            |
| `baseUrl`       | `string`                                                       | Remplacement de base URL optionnel par modèle.                                       |
| `headers`       | `Record<string, string>`                                       | En-têtes statiques optionnels par modèle.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalités acceptées par le modèle.                                               |
| `reasoning`     | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.                               |
| `contextWindow` | `number`                                                       | Fenêtre de contexte native du fournisseur.                                             |
| `contextTokens` | `number`                                                       | Plafond de contexte runtime effectif optionnel quand il diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de tokens de sortie quand il est connu.                                           |
| `cost`          | `object`                                                       | Tarification optionnelle en USD par million de tokens, y compris `tieredPricing` optionnel. |
| `compat`        | `object`                                                       | Indicateurs de compatibilité optionnels correspondant à la compatibilité de configuration de modèle OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Statut de listage. Supprimez uniquement quand la ligne ne doit pas apparaître du tout.          |
| `statusReason`  | `string`                                                       | Raison optionnelle affichée avec un statut non disponible.                            |
| `replaces`      | `string[]`                                                     | Anciens identifiants de modèle locaux au fournisseur que ce modèle remplace.                       |
| `replacedBy`    | `string`                                                       | Identifiant de modèle local au fournisseur de remplacement pour les lignes obsolètes.                    |
| `tags`          | `string[]`                                                     | Tags stables utilisés par les sélecteurs et les filtres.                                    |

Champs de suppression :

| Champ                      | Type       | Signification                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | Identifiant de fournisseur de la ligne amont à supprimer. Doit être détenu par ce plugin ou déclaré comme alias détenu. |
| `model`                    | `string`   | Identifiant de modèle local au fournisseur à supprimer.                                                                      |
| `reason`                   | `string`   | Message optionnel affiché quand la ligne supprimée est demandée directement.                                     |
| `when.baseUrlHosts`        | `string[]` | Liste optionnelle des hôtes de base URL effectifs du fournisseur requis avant que la suppression s’applique.               |
| `when.providerConfigApiIn` | `string[]` | Liste optionnelle des valeurs `api` exactes de configuration du fournisseur requises avant que la suppression s’applique.              |

Ne mettez pas de données uniquement runtime dans `modelCatalog`. Utilisez `static` uniquement quand les lignes
du manifeste sont assez complètes pour permettre aux surfaces de liste filtrée par fournisseur et de sélection d’ignorer
la découverte registre/runtime. Utilisez `refreshable` quand les lignes du manifeste sont des graines
listables utiles ou des compléments, mais qu’une actualisation/un cache peut ajouter d’autres lignes plus tard ;
les lignes actualisables ne font pas autorité à elles seules. Utilisez `runtime` quand OpenClaw
doit charger le runtime du fournisseur pour connaître la liste.

## Référence modelIdNormalization

Utilisez `modelIdNormalization` pour un nettoyage peu coûteux des identifiants de modèle détenu par le fournisseur qui doit
se produire avant le chargement du runtime du fournisseur. Cela conserve les alias comme les noms de modèle courts,
les identifiants hérités locaux au fournisseur et les règles de préfixe de proxy dans le manifeste du plugin
propriétaire plutôt que dans les tables principales de sélection de modèle.

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

| Champ                                | Type                    | Signification                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | Alias exacts d’identifiant de modèle insensibles à la casse. Les valeurs sont renvoyées telles qu’écrites.                  |
| `stripPrefixes`                      | `string[]`              | Préfixes à supprimer avant la recherche d’alias, utiles pour la duplication héritée fournisseur/modèle.     |
| `prefixWhenBare`                     | `string`                | Préfixe à ajouter quand l’identifiant de modèle normalisé ne contient pas déjà `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Règles conditionnelles de préfixe d’identifiant nu après recherche d’alias, indexées par `modelPrefix` et `prefix`. |

## Référence providerEndpoints

Utilisez `providerEndpoints` pour la classification des points de terminaison que la stratégie générique de requête
doit connaître avant le chargement du runtime du fournisseur. Le cœur détient toujours la signification de chaque
`endpointClass` ; les manifestes de plugin détiennent les métadonnées d’hôte et de base URL.

Champs d’endpoint :

| Champ                          | Type       | Signification                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe d’endpoint principale connue, comme `openrouter`, `moonshot-native` ou `google-vertex`. |
| `hosts`                        | `string[]` | Noms d’hôte exacts qui correspondent à la classe d’endpoint.                                   |
| `hostSuffixes`                 | `string[]` | Suffixes d’hôte qui correspondent à la classe d’endpoint. Préfixez avec `.` pour une correspondance limitée aux suffixes de domaine. |
| `baseUrls`                     | `string[]` | URL de base HTTP(S) normalisées exactes qui correspondent à la classe d’endpoint.              |
| `googleVertexRegion`           | `string`   | Région Google Vertex statique pour les hôtes globaux exacts.                                  |
| `googleVertexRegionHostSuffix` | `string`   | Suffixe à retirer des hôtes correspondants pour exposer le préfixe de région Google Vertex.   |

## Référence providerRequest

Utilisez `providerRequest` pour des métadonnées économiques de compatibilité des requêtes dont la politique de requête générique a besoin sans charger le runtime du fournisseur. Conservez la réécriture de charge utile propre au comportement dans les hooks de runtime du fournisseur ou dans les helpers partagés de famille de fournisseurs.

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
| `family`              | `string`     | Libellé de famille de fournisseurs utilisé par les décisions et diagnostics génériques de compatibilité des requêtes. |
| `compatibilityFamily` | `"moonshot"` | Compartiment facultatif de compatibilité de famille de fournisseurs pour les helpers de requête partagés. |
| `openAICompletions`   | `object`     | Indicateurs de requête de complétions compatibles avec OpenAI, actuellement `supportsStreamingUsage`. |

## Référence secretProviderIntegrations

Utilisez `secretProviderIntegrations` lorsqu’un plugin peut publier un préréglage réutilisable de fournisseur exec SecretRef. OpenClaw lit ces métadonnées avant le chargement du runtime du plugin, stocke la propriété du plugin dans `secrets.providers.<alias>.pluginIntegration` et laisse la résolution effective des secrets au runtime SecretRef. Les préréglages ne sont exposés que pour les plugins groupés et les plugins installés découverts à partir des racines d’installation de plugins gérées, comme les installations git et ClawHub.

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

La clé de la map est l’id d’intégration. Si `providerAlias` est omis, OpenClaw utilise l’id d’intégration comme alias de fournisseur SecretRef. Les alias de fournisseur doivent correspondre au modèle normal d’alias de fournisseur SecretRef, par exemple `team-secrets` ou `onepassword-work`.

Lorsqu’un opérateur sélectionne le préréglage, OpenClaw écrit une référence de fournisseur comme :

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

Au démarrage/rechargement, OpenClaw résout ce fournisseur en chargeant les métadonnées actuelles du manifeste du plugin, en vérifiant que le plugin propriétaire est installé et actif, puis en matérialisant la commande exec à partir du manifeste. Désactiver ou supprimer le plugin révoque le fournisseur pour les SecretRefs actifs. Les opérateurs qui veulent une configuration exec autonome peuvent toujours écrire directement des fournisseurs `command`/`args` manuels.

Seuls les préréglages `source: "exec"` sont actuellement pris en charge. `command` doit être `${node}`, et `args[0]` doit être un script de résolution relatif à la racine du plugin avec `./`. OpenClaw le matérialise au démarrage/rechargement vers l’exécutable Node actuel et le chemin absolu du script dans le plugin. Les options Node comme `--require`, `--import`, `--loader`, `--env-file`, `--eval` et `--print` ne font pas partie du contrat de préréglage de manifeste. Les opérateurs qui ont besoin de commandes non Node peuvent configurer directement des fournisseurs exec manuels autonomes.

OpenClaw dérive `trustedDirs` pour les préréglages de manifeste à partir de la racine du plugin et, pour les préréglages `${node}`, du répertoire de l’exécutable Node actuel. Les `trustedDirs` définis par le manifeste sont ignorés. Les autres options de fournisseur exec comme `timeoutMs`, `maxOutputBytes`, `jsonOnly`, `env`, `passEnv` et `allowInsecurePath` sont transmises à la configuration normale du fournisseur exec SecretRef.

## Référence modelPricing

Utilisez `modelPricing` lorsqu’un fournisseur doit contrôler le comportement de tarification du plan de contrôle avant le chargement du runtime. Le cache de tarification du Gateway lit ces métadonnées sans importer le code de runtime du fournisseur.

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
| `external`   | `boolean`         | Définissez `false` pour les fournisseurs locaux/auto-hébergés qui ne doivent jamais récupérer la tarification OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mappage de recherche de tarification OpenRouter. `false` désactive la recherche OpenRouter pour ce fournisseur. |
| `liteLLM`    | `false \| object` | Mappage de recherche de tarification LiteLLM. `false` désactive la recherche LiteLLM pour ce fournisseur. |

Champs de source :

| Champ                      | Type               | Signification                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Id de fournisseur du catalogue externe lorsqu’il diffère de l’id de fournisseur OpenClaw, par exemple `z-ai` pour un fournisseur `zai`. |
| `passthroughProviderModel` | `boolean`          | Traite les ids de modèle contenant une barre oblique comme des refs fournisseur/modèle imbriquées, utile pour les fournisseurs proxy comme OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes supplémentaires d’id de modèle du catalogue externe. `version-dots` essaie des ids de version à points comme `claude-opus-4.6`. |

### Index des fournisseurs OpenClaw

L’Index des fournisseurs OpenClaw est une métadonnée d’aperçu détenue par OpenClaw pour les fournisseurs dont les plugins ne sont peut-être pas encore installés. Il ne fait pas partie d’un manifeste de plugin. Les manifestes de plugins restent l’autorité pour les plugins installés. L’Index des fournisseurs est le contrat de repli interne que les futures surfaces de sélection de modèle avant installation et de fournisseurs installables consommeront lorsqu’un plugin de fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. Manifeste `modelCatalog` du plugin installé.
3. Cache de catalogue de modèles issu d’un rafraîchissement explicite.
4. Lignes d’aperçu de l’Index des fournisseurs OpenClaw.

L’Index des fournisseurs ne doit pas contenir de secrets, d’état activé, de hooks de runtime ni de données de modèle spécifiques à un compte en direct. Ses catalogues d’aperçu utilisent la même forme de ligne de fournisseur `modelCatalog` que les manifestes de plugins, mais doivent rester limités aux métadonnées d’affichage stables, sauf si des champs d’adaptateur de runtime comme `api`, `baseUrl`, la tarification ou les indicateurs de compatibilité sont intentionnellement maintenus alignés avec le manifeste du plugin installé. Les fournisseurs avec découverte `/models` en direct doivent écrire les lignes rafraîchies via le chemin explicite du cache de catalogue de modèles au lieu de faire appeler les API du fournisseur par l’affichage normal de liste ou l’onboarding.

Les entrées de l’Index des fournisseurs peuvent aussi transporter des métadonnées de plugin installable pour les fournisseurs dont le plugin a été déplacé hors du noyau ou n’est pas encore installé pour une autre raison. Ces métadonnées reflètent le modèle du catalogue de canaux : nom de package, spécification d’installation npm, intégrité attendue et libellés économiques de choix d’authentification suffisent à afficher une option de configuration installable. Une fois le plugin installé, son manifeste l’emporte et l’entrée de l’Index des fournisseurs est ignorée pour ce fournisseur.

Les clés de capacité de niveau supérieur héritées sont obsolètes. Utilisez `openclaw doctor --fix` pour déplacer `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal du manifeste ne traite plus ces champs de niveau supérieur comme propriété de capacité.

## Manifeste ou package.json

Les deux fichiers ont des rôles différents :

| Fichier                   | Utilisation                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’interface utilisateur qui doivent exister avant l’exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, les garde-fous d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne l’empaquetage, les fichiers d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs package.json qui affectent la découverte

Certaines métadonnées de plugin pré-runtime résident intentionnellement dans `package.json` sous le bloc `openclaw` au lieu de `openclaw.plugin.json`. `openclaw.bundle` et `openclaw.bundle.json` ne sont pas des contrats de plugin OpenClaw ; les plugins natifs doivent utiliser `openclaw.plugin.json` plus les champs `package.json#openclaw` pris en charge ci-dessous.

Exemples importants :

| Champ                                                                                      | Ce que cela signifie                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | Déclare les points d’entrée natifs du Plugin. Doit rester dans le répertoire du package du Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | Déclare les points d’entrée d’exécution JavaScript générés pour les packages installés. Doit rester dans le répertoire du package du Plugin.                                                                 |
| `openclaw.setupEntry`                                                                      | Point d’entrée léger réservé à la configuration, utilisé pendant l’intégration, le démarrage différé du canal et la découverte en lecture seule de l’état du canal/SecretRef. Doit rester dans le répertoire du package du Plugin. |
| `openclaw.runtimeSetupEntry`                                                               | Déclare le point d’entrée de configuration JavaScript généré pour les packages installés. Nécessite `setupEntry`, doit exister et doit rester dans le répertoire du package du Plugin.                         |
| `openclaw.channel`                                                                         | Métadonnées peu coûteuses du catalogue de canaux, comme les libellés, les chemins de documentation, les alias et le texte de sélection.                                                                                                 |
| `openclaw.channel.commands`                                                                | Métadonnées statiques de commande native et de valeur par défaut automatique de compétence native, utilisées par les surfaces de configuration, d’audit et de liste de commandes avant le chargement de l’exécution du canal.                                          |
| `openclaw.channel.configuredState`                                                         | Métadonnées légères de vérificateur d’état configuré pouvant répondre à « une configuration uniquement par env existe-t-elle déjà ? » sans charger l’exécution complète du canal.                                         |
| `openclaw.channel.persistedAuthState`                                                      | Métadonnées légères de vérificateur d’authentification persistée pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger l’exécution complète du canal.                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indications d’installation/mise à jour pour les Plugins groupés et publiés en externe.                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | Version minimale prise en charge de l’hôte OpenClaw, avec un plancher semver comme `>=2026.3.22` ou `>=2026.5.1-beta.1`.                                                                             |
| `openclaw.compat.pluginApi`                                                                | Plage minimale de l’API Plugin OpenClaw requise par ce package, avec un plancher semver comme `>=2026.5.27`.                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | Chaîne d’intégrité npm dist attendue, telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à cette valeur.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | Autorise un chemin étroit de récupération par réinstallation de Plugin groupé lorsque la configuration est invalide.                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | Alias de packages npm qui doivent se matérialiser lorsque leurs contraintes de plateforme dans le lockfile correspondent à l’hôte actuel.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | Permet aux surfaces de canal d’exécution de configuration de se charger avant l’écoute, puis diffère le Plugin de canal entièrement configuré jusqu’à l’activation après écoute.                                                 |

Les métadonnées du manifeste déterminent quels choix de provider/canal/configuration apparaissent dans
l’intégration avant le chargement de l’exécution. `package.json#openclaw.install` indique à
l’intégration comment récupérer ou activer ce Plugin lorsque l’utilisateur choisit l’un de ces
choix. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du
registre de manifestes pour les sources de Plugins non groupés. Les valeurs invalides sont rejetées ;
les valeurs plus récentes mais valides ignorent les Plugins externes sur les hôtes plus anciens. Les
Plugins source groupés sont supposés être co-versionnés avec le checkout de l’hôte.

`openclaw.install.requiredPlatformPackages` est destiné aux packages npm qui exposent
des binaires natifs requis via des alias optionnels propres à la plateforme. Listez le
nom nu du package npm pour chaque alias de plateforme pris en charge. Pendant l’installation npm,
OpenClaw vérifie uniquement l’alias déclaré dont les contraintes de lockfile correspondent à
l’hôte actuel. Si npm signale une réussite mais omet cet alias, OpenClaw réessaie une fois
avec un cache frais et annule l’installation si l’alias est toujours manquant.

`openclaw.compat.pluginApi` est appliqué pendant l’installation du package pour les sources de
Plugins non groupés. Utilisez-le pour le plancher de l’API SDK/runtime Plugin OpenClaw contre lequel
le package a été construit. Il peut être plus strict que `minHostVersion` lorsqu’un
package Plugin nécessite une API plus récente tout en conservant une indication d’installation plus basse pour d’autres
flux. La synchronisation des releases officielles OpenClaw augmente par défaut les planchers d’API des Plugins officiels existants
à la version de release OpenClaw, mais les releases limitées aux Plugins peuvent conserver un
plancher plus bas lorsque le package prend intentionnellement en charge des hôtes plus anciens. N’utilisez pas
la seule version du package comme contrat de compatibilité. `peerDependencies.openclaw`
reste une métadonnée de package npm ; OpenClaw utilise le contrat `openclaw.compat.pluginApi`
pour les décisions de compatibilité d’installation.

Les métadonnées officielles d’installation à la demande doivent utiliser `clawhubSpec` lorsque le Plugin est
publié sur ClawHub ; l’intégration traite cela comme la source distante préférée et
enregistre les faits d’artefact ClawHub après l’installation. `npmSpec` reste le repli de compatibilité
pour les packages qui ne sont pas encore passés à ClawHub.

L’épinglage exact de version npm réside déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées de catalogue externes officielles
doivent associer des specs exactes à `expectedIntegrity` afin que les flux de mise à jour échouent
de manière fermée si l’artefact npm récupéré ne correspond plus à la release épinglée.
L’intégration interactive propose toujours des specs npm de registre de confiance, y compris les
noms de packages nus et les dist-tags, pour compatibilité. Les diagnostics de catalogue peuvent
distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec
incompatibilité de nom de package et avec choix par défaut invalide. Ils avertissent aussi lorsque
`expectedIntegrity` est présent mais qu’il n’existe aucune source npm valide qu’il peut épingler.
Lorsque `expectedIntegrity` est présent,
les flux d’installation/mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est
enregistrée sans épingle d’intégrité.

Les Plugins de canal doivent fournir `openclaw.setupEntry` lorsque l’état, la liste des canaux
ou les analyses SecretRef doivent identifier les comptes configurés sans charger l’exécution complète.
L’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs de configuration,
d’état et de secrets sûrs pour la configuration ; gardez les clients réseau, les écouteurs Gateway et
les runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée d’exécution ne remplacent pas les contrôles de frontière de package pour les champs de
point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un
chemin `openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est intentionnellement étroit. Il ne rend pas
installables des configurations arbitrairement cassées. Aujourd’hui, il autorise seulement les flux d’installation
à récupérer après des échecs spécifiques de mise à niveau de Plugins groupés obsolètes, comme un
chemin de Plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même
Plugin groupé. Les erreurs de configuration sans rapport bloquent toujours l’installation et envoient les opérateurs
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

Utilisez-la lorsque les flux de configuration, doctor, état ou présence en lecture seule nécessitent une sonde
d’authentification oui/non peu coûteuse avant le chargement du Plugin de canal complet. L’état d’authentification persistée n’est
pas l’état de canal configuré : n’utilisez pas ces métadonnées pour activer automatiquement des Plugins,
réparer des dépendances d’exécution ou décider si l’exécution d’un canal doit se charger.
L’export cible doit être une petite fonction qui lit uniquement l’état persisté ; ne
le routez pas via le barrel complet de l’exécution du canal.

`openclaw.channel.configuredState` suit la même forme pour les vérifications peu coûteuses de configuration
uniquement par env :

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

Utilisez-la lorsqu’un canal peut répondre à l’état configuré à partir de l’env ou d’autres petites
entrées hors exécution. Si la vérification nécessite une résolution complète de configuration ou la vraie
exécution du canal, conservez cette logique dans le hook Plugin `config.hasConfiguredState`
à la place.

## Précédence de découverte (ids de Plugins en double)

OpenClaw découvre les Plugins à partir de plusieurs racines. Pour l’ordre brut d’analyse du système de fichiers,
consultez [Ordre d’analyse des Plugins
](/fr/gateway/configuration-reference#plugin-scan-order). Si deux découvertes
partagent le même `id`, seul le manifeste à la **précédence la plus élevée** est conservé ;
les doublons de précédence inférieure sont supprimés au lieu d’être chargés à côté de lui.

Précédence, de la plus élevée à la plus basse :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Groupé** — Plugins livrés avec OpenClaw
3. **Installation globale** — Plugins installés dans la racine globale des Plugins OpenClaw
4. **Workspace** — Plugins découverts relativement au workspace actuel

Implications :

- Une copie forkée ou obsolète d’un Plugin groupé présente dans le workspace ne masquera pas la build groupée.
- Pour remplacer réellement un Plugin groupé par un Plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par précédence plutôt que de dépendre de la découverte du workspace.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.
- Les remplacements de doublons sélectionnés par la configuration sont formulés comme des remplacements explicites dans les diagnostics, mais émettent tout de même un avertissement afin que les forks obsolètes et les masquages accidentels restent visibles.

## Exigences du JSON Schema

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.
- Lors de l’extension ou du fork d’un plugin intégré avec de nouvelles clés de configuration, mettez à jour en même temps le `configSchema` du `openclaw.plugin.json` de ce plugin. Les schémas des plugins intégrés sont stricts, donc l’ajout de `plugins.entries.<id>.config.myNewKey` dans la configuration utilisateur sans ajouter `myNewKey` à `configSchema.properties` sera rejeté avant le chargement du runtime du plugin.

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

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’id du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des ids de plugins **découvrables**. Les ids inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les journaux.

Consultez la [référence de configuration](/fr/gateway/configuration) pour le schéma complet de `plugins.*`.

## Notes

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local. Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les clés non citées sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez les clés personnalisées de premier niveau.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerCatalogEntry` doit rester léger et ne doit pas importer de code runtime étendu ; utilisez-le pour des métadonnées statiques de catalogue de fournisseurs ou des descripteurs de découverte ciblés, pas pour une exécution au moment des requêtes.
- Les types de plugins exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (`legacy` par défaut).
- Déclarez le type de plugin exclusif dans ce manifeste. `OpenClawPluginDefinition.kind` dans l’entrée runtime est obsolète et reste uniquement comme fallback de compatibilité pour les plugins plus anciens.
- Les métadonnées de variables d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` obsolète et `channelEnvVars`) sont uniquement déclaratives. Le statut, l’audit, la validation de livraison cron et les autres surfaces en lecture seule appliquent toujours la politique de confiance du plugin et d’activation effective avant de considérer une variable d’environnement comme configurée.
- Pour les métadonnées de l’assistant runtime nécessitant du code fournisseur, consultez les [hooks de runtime fournisseur](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Connexe

<CardGroup cols={3}>
  <Card title="Créer des plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Premiers pas avec les plugins.
  </Card>
  <Card title="Architecture des plugins" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="Vue d’ensemble du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK de plugin et imports de sous-chemins.
  </Card>
</CardGroup>
