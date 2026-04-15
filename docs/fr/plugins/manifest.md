---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration du Plugin ou déboguer les erreurs de validation du Plugin
summary: Exigences du manifeste du Plugin + schéma JSON (validation stricte de la configuration)
title: Manifeste du Plugin
x-i18n:
    generated_at: "2026-04-15T06:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste du Plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste natif de Plugin OpenClaw**.

Pour les dispositions de bundle compatibles, consultez [Plugin bundles](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition de composant Claude
  par défaut sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement ces dispositions de bundle également, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les racines de
Skills déclarées, les racines de commandes Claude, les valeurs par défaut de `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes d’exécution d’OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du Plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du Plugin**. Les manifestes absents ou invalides sont traités comme
des erreurs de Plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de Plugin : [Plugins](/fr/tools/plugin).
Pour le modèle natif de capacités et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` est la métadonnée qu’OpenClaw lit avant de charger le
code de votre Plugin.

Utilisez-le pour :

- l’identité du Plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer l’environnement d’exécution du Plugin
- les indications d’activation peu coûteuses que les surfaces du plan de contrôle peuvent inspecter avant le chargement de l’environnement d’exécution
- les descripteurs de configuration peu coûteux que les surfaces de configuration/onboarding peuvent inspecter avant le chargement de l’environnement d’exécution
- les métadonnées d’alias et d’activation automatique qui doivent être résolues avant le chargement de l’environnement d’exécution du Plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent auto-activer le Plugin avant le chargement de l’environnement d’exécution
- les instantanés statiques de propriété des capacités utilisés pour le câblage de compatibilité intégré et la couverture des contrats
- les métadonnées peu coûteuses de l’exécuteur QA que l’hôte partagé `openclaw qa` peut inspecter avant le chargement de l’environnement d’exécution du Plugin
- les métadonnées de configuration spécifiques aux canaux qui doivent être fusionnées dans les surfaces de catalogue et de validation sans charger l’environnement d’exécution
- les indications d’interface pour la configuration

Ne l’utilisez pas pour :

- enregistrer un comportement d’exécution
- déclarer des points d’entrée de code
- les métadonnées d’installation npm

Ces éléments appartiennent à votre code de Plugin et à `package.json`.

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
  "description": "Plugin fournisseur OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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
      "choiceLabel": "Clé API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Clé API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Clé API",
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

## Référence des champs de niveau supérieur

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                                                |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Oui         | `string`                         | ID canonique du Plugin. C’est l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                                      |
| `configSchema`                      | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce Plugin.                                                                                                                                                       |
| `enabledByDefault`                  | Non         | `true`                           | Marque un Plugin intégré comme activé par défaut. Omettez-le, ou définissez une valeur autre que `true`, pour laisser le Plugin désactivé par défaut.                                                      |
| `legacyPluginIds`                   | Non         | `string[]`                       | IDs hérités qui se normalisent vers cet ID canonique de Plugin.                                                                                                                                              |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | IDs de fournisseurs qui doivent auto-activer ce Plugin lorsque l’authentification, la configuration ou les références de modèles les mentionnent.                                                           |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de Plugin utilisé par `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Non         | `string[]`                       | IDs de canaux détenus par ce Plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                       |
| `providers`                         | Non         | `string[]`                       | IDs de fournisseurs détenus par ce Plugin.                                                                                                                                                                   |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de famille de modèles détenues par le manifeste et utilisées pour charger automatiquement le Plugin avant l’environnement d’exécution.                                                 |
| `cliBackends`                       | Non         | `string[]`                       | IDs de backend d’inférence CLI détenus par ce Plugin. Utilisés pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                     |
| `commandAliases`                    | Non         | `object[]`                       | Noms de commandes détenus par ce Plugin qui doivent produire une configuration et des diagnostics CLI tenant compte du Plugin avant le chargement de l’environnement d’exécution.                           |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées d’environnement d’authentification du fournisseur, peu coûteuses, qu’OpenClaw peut inspecter sans charger le code du Plugin.                                                                   |
| `providerAuthAliases`               | Non         | `Record<string, string>`         | IDs de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de codage qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                    | Non         | `Record<string, string[]>`       | Métadonnées d’environnement de canal, peu coûteuses, qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez ceci pour les surfaces de configuration ou d’authentification de canal pilotées par l’environnement que les helpers génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées de choix d’authentification peu coûteuses pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des flags CLI.                                           |
| `activation`                        | Non         | `object`                         | Indications d’activation peu coûteuses pour le chargement déclenché par des fournisseurs, commandes, canaux, routes et capacités. Métadonnées uniquement ; l’environnement d’exécution du Plugin reste responsable du comportement réel. |
| `setup`                             | Non         | `object`                         | Descripteurs de configuration/onboarding peu coûteux que les surfaces de découverte et de configuration peuvent inspecter sans charger l’environnement d’exécution du Plugin.                               |
| `qaRunners`                         | Non         | `object[]`                       | Descripteurs d’exécuteurs QA peu coûteux utilisés par l’hôte partagé `openclaw qa` avant le chargement de l’environnement d’exécution du Plugin.                                                           |
| `contracts`                         | Non         | `object`                         | Instantané statique des capacités intégrées pour la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de musique, la génération de vidéo, la récupération web, la recherche web et la propriété des outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste et fusionnées dans les surfaces de découverte et de validation avant le chargement de l’environnement d’exécution.                         |
| `skills`                            | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                             |
| `name`                              | Non         | `string`                         | Nom lisible du Plugin.                                                                                                                                                                                       |
| `description`                       | Non         | `string`                         | Résumé court affiché dans les surfaces du Plugin.                                                                                                                                                            |
| `version`                           | Non         | `string`                         | Version informative du Plugin.                                                                                                                                                                               |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés d’interface, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                                      |

## Référence de `providerAuthChoices`

Chaque entrée de `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit cela avant le chargement de l’environnement d’exécution du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel ce choix appartient.                                                              |
| `method`              | Oui         | `string`                                        | ID de la méthode d’authentification vers laquelle répartir.                                                |
| `choiceId`            | Oui         | `string`                                        | ID stable de choix d’authentification utilisé par les flux d’onboarding et CLI.                            |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw utilise `choiceId` comme repli.                  |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                      |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant.    |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque ce choix dans les sélecteurs de l’assistant tout en autorisant la sélection manuelle via la CLI.   |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | IDs hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.                 |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                     |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l’utilisateur pour ce groupe.                                                            |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                         |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul flag.                              |
| `cliFlag`             | Non         | `string`                                        | Nom du flag CLI, tel que `--openrouter-api-key`.                                                           |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, telle que `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                      |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence de `commandAliases`

Utilisez `commandAliases` lorsqu’un Plugin possède un nom de commande d’exécution que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou essayer d’exécuter comme une commande CLI racine. OpenClaw
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

| Champ        | Obligatoire | Type              | Signification                                                                    |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce Plugin.                                       |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme une commande slash de chat plutôt qu’une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, si elle existe.  |

## Référence de `activation`

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’activer plus tard.

## Référence de `qaRunners`

Utilisez `qaRunners` lorsqu’un Plugin contribue à un ou plusieurs exécuteurs de transport sous la racine partagée
`openclaw qa`. Gardez ces métadonnées simples et statiques ; l’environnement d’exécution du Plugin reste responsable de l’enregistrement CLI réel via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter la voie QA Matrix en direct, adossée à Docker, sur un homeserver jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                       |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.      |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement d’exécution et
ne remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée d’exécution/de Plugin.
Les consommateurs actuels l’utilisent comme un indice de filtrage avant un chargement plus large du Plugin, donc
l’absence de métadonnées d’activation n’a généralement qu’un coût de performance ; elle ne devrait pas
modifier la correction tant que les replis hérités de propriété du manifeste existent encore.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Champ            | Obligatoire | Type                                                 | Signification                                                     |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | Non         | `string[]`                                           | IDs de fournisseurs qui doivent activer ce Plugin lorsqu’ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commandes qui doivent activer ce Plugin.                   |
| `onChannels`     | Non         | `string[]`                                           | IDs de canaux qui doivent activer ce Plugin.                      |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent activer ce Plugin.                    |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications générales de capacités utilisées par la planification d’activation du plan de contrôle. |

Consommateurs actifs actuels :

- la planification CLI déclenchée par commande utilise comme repli
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/de canal déclenchée par canal utilise comme repli la propriété héritée `channels[]`
  lorsqu’il manque des métadonnées explicites d’activation de canal
- la planification de configuration/d’exécution déclenchée par fournisseur utilise comme repli la propriété héritée
  `providers[]` et la propriété de niveau supérieur `cliBackends[]` lorsque des métadonnées explicites d’activation
  de fournisseur sont absentes

## Référence de `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées de Plugin, simples et détenues par le Plugin,
avant le chargement de l’environnement d’exécution.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Le `cliBackends` de niveau supérieur reste valide et continue de décrire les
backends d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour les
flux de configuration/plan de contrôle qui doivent rester uniquement basés sur des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` constituent la
surface privilégiée, d’abord basée sur des descripteurs, pour la découverte de la configuration. Si le descripteur se contente uniquement
de restreindre le Plugin candidat et que la configuration a encore besoin de hooks d’exécution plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme
chemin d’exécution de repli.

Comme la recherche de configuration peut exécuter du code `setup-api` détenu par le Plugin,
les valeurs normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi tous les
Plugins découverts. Une propriété ambiguë échoue de manière fermée au lieu de choisir un
gagnant selon l’ordre de découverte.

### Référence de `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Oui         | `string`   | ID du fournisseur exposé pendant la configuration ou l’onboarding. Gardez les IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger l’environnement d’exécution complet. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement de l’environnement d’exécution du Plugin. |

### Champs de `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration du fournisseur exposés pendant la configuration et l’onboarding.     |
| `cliBackends`      | Non         | `string[]` | IDs de backend au moment de la configuration utilisés pour une recherche de configuration d’abord basée sur des descripteurs. Gardez les IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration détenus par la surface de configuration de ce Plugin.            |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration a encore besoin de l’exécution de `setup-api` après la recherche par descripteur. |

## Référence de `uiHints`

`uiHints` est une correspondance entre les noms de champs de configuration et de petites indications de rendu.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clé API",
      "help": "Utilisée pour les requêtes OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé du champ destiné à l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                     |
| `tags`        | `string[]` | Tags d’interface facultatifs.           |
| `advanced`    | `boolean`  | Marque le champ comme avancé.           |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les champs de formulaire. |

## Référence de `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu’OpenClaw peut
lire sans importer l’environnement d’exécution du Plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                   |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de fournisseurs de parole détenus par ce Plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseurs de transcription en temps réel détenus par ce Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseurs de voix en temps réel détenus par ce Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseurs de compréhension des médias détenus par ce Plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseurs de génération d’images détenus par ce Plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseurs de génération de vidéo détenus par ce Plugin. |
| `webFetchProviders`              | `string[]` | IDs de fournisseurs de récupération web détenus par ce Plugin.  |
| `webSearchProviders`             | `string[]` | IDs de fournisseurs de recherche web détenus par ce Plugin.     |
| `tools`                          | `string[]` | Noms d’outils d’agent détenus par ce Plugin pour les vérifications de contrat intégrées. |

## Référence de `channelConfigs`

Utilisez `channelConfigs` lorsqu’un Plugin de canal a besoin de métadonnées de configuration simples avant
le chargement de l’environnement d’exécution.

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
          "label": "URL du homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connexion au homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Chaque entrée de canal peut inclure :

| Champ         | Type                     | Signification                                                                              |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés d’interface, espaces réservés et indications de sensibilité facultatifs pour cette section de configuration du canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées d’exécution ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.                |
| `preferOver`  | `string[]`               | IDs de Plugin hérités ou de priorité inférieure que ce canal doit surpasser dans les surfaces de sélection. |

## Référence de `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre Plugin fournisseur à partir
d’IDs abrégés de modèle comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement de l’environnement d’exécution du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` du propriétaire
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un Plugin non intégré et un Plugin intégré correspondent tous deux, le Plugin non intégré
  l’emporte
- les ambiguïtés restantes sont ignorées jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs abrégés de modèle.                  |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs abrégés de modèle après suppression du suffixe de profil. |

Les clés de capacités héritées au niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal du
manifeste ne traite plus ces champs de niveau supérieur comme une
propriété de capacité.

## Manifeste versus package.json

Les deux fichiers remplissent des rôles différents :

| Fichier                | Utilisation                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Découverte, validation de la configuration, métadonnées de choix d’authentification et indications d’interface qui doivent exister avant l’exécution du code du Plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du Plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers de point d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs de package.json qui affectent la découverte

Certaines métadonnées de Plugin avant exécution vivent intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée de Plugin natifs.                                                                                                 |
| `openclaw.setupEntry`                                             | Point d’entrée léger, réservé à la configuration, utilisé pendant l’onboarding et le démarrage différé des canaux.                           |
| `openclaw.channel`                                                | Métadonnées simples de catalogue de canal, comme les libellés, chemins de documentation, alias et texte de sélection.                        |
| `openclaw.channel.configuredState`                                | Métadonnées légères du vérificateur d’état configuré pouvant répondre à « une configuration uniquement par variables d’environnement existe-t-elle déjà ? » sans charger l’environnement d’exécution complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères du vérificateur d’authentification persistée pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger l’environnement d’exécution complet du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les Plugins intégrés et publiés en externe.                                                      |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                      |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, en utilisant un plancher semver comme `>=2026.3.22`.                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin de récupération étroit pour la réinstallation d’un Plugin intégré lorsque la configuration est invalide.                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le Plugin de canal complet au démarrage.                       |

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre de manifestes. Les valeurs invalides sont rejetées ; les valeurs valides mais plus récentes ignorent le
Plugin sur les hôtes plus anciens.

`openclaw.install.allowInvalidConfigRecovery` est intentionnellement étroit. Il
ne rend pas arbitrairement installables des configurations cassées. Aujourd’hui, il permet seulement aux flux d’installation
de récupérer à partir d’échecs spécifiques de mise à niveau d’un Plugin intégré devenu obsolète, comme un
chemin de Plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même
Plugin intégré. Les erreurs de configuration non liées bloquent toujours l’installation et envoient les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un petit
module de vérification :

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

Utilisez-le lorsque les flux de configuration, doctor ou d’état configuré ont besoin d’une
vérification simple oui/non de l’authentification avant le chargement du Plugin de canal complet. L’export ciblé doit être une petite
fonction qui lit uniquement l’état persisté ; ne la faites pas transiter par le barrel complet de l’environnement d’exécution du
canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications simples d’état
configuré uniquement basées sur l’environnement :

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

Utilisez-le lorsqu’un canal peut répondre à l’état configuré à partir de variables d’environnement ou d’autres petites
entrées hors environnement d’exécution. Si la vérification nécessite une résolution complète de la configuration ou le véritable
environnement d’exécution du canal, conservez cette logique dans le hook `config.hasConfiguredState`
du Plugin à la place.

## Exigences du schéma JSON

- **Chaque Plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.

## Comportement de validation

- Les clés inconnues dans `channels.*` sont des **erreurs**, sauf si l’ID de canal est déclaré par
  un manifeste de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des IDs de Plugin **découvrables**. Les IDs inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est remonté dans Doctor + les journaux.

Consultez [Référence de configuration](/fr/gateway/configuration) pour le schéma complet de `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les Plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- L’environnement d’exécution charge toujours le module du Plugin séparément ; le manifeste sert uniquement à la
  découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les
  clés non entre guillemets sont acceptés tant que la valeur finale reste bien un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d’ajouter
  ici des clés personnalisées au niveau supérieur.
- `providerAuthEnvVars` est le chemin de métadonnées simple pour les sondes d’authentification, la
  validation des marqueurs de variables d’environnement et les surfaces similaires d’authentification de fournisseur
  qui ne doivent pas démarrer l’environnement d’exécution du Plugin uniquement pour inspecter les noms de variables d’environnement.
- `providerAuthAliases` permet à des variantes de fournisseur de réutiliser les variables d’environnement d’authentification,
  les profils d’authentification, l’authentification adossée à la configuration et le choix d’onboarding par clé API
  d’un autre fournisseur sans coder en dur cette relation dans le cœur.
- `channelEnvVars` est le chemin de métadonnées simple pour le repli basé sur les variables d’environnement du shell, les invites de configuration
  et les surfaces de canal similaires qui ne doivent pas démarrer l’environnement d’exécution du Plugin
  uniquement pour inspecter les noms de variables d’environnement.
- `providerAuthChoices` est le chemin de métadonnées simple pour les sélecteurs de choix d’authentification,
  la résolution de `--auth-choice`, la correspondance avec le fournisseur préféré et l’enregistrement simple des flags CLI
  d’onboarding avant le chargement de l’environnement d’exécution du fournisseur. Pour les métadonnées d’assistant d’exécution
  qui nécessitent du code fournisseur, consultez
  [Hooks d’exécution de fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de Plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu’un
  Plugin n’en a pas besoin.
- Si votre Plugin dépend de modules natifs, documentez les étapes de build ainsi que toute
  exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des Plugins](/fr/plugins/building-plugins) — bien démarrer avec les Plugins
- [Architecture des Plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de Plugin
