---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez fournir un schéma de configuration de plugin ou déboguer des erreurs de validation de Plugin
summary: Manifeste de Plugin + exigences de schéma JSON (validation stricte de la configuration)
title: Manifeste de Plugin
x-i18n:
    generated_at: "2026-04-23T07:06:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: de71b9d556c2696d3279f202b66d57aa8014e9c89d81e3f453602744120d1675
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste de Plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste de Plugin OpenClaw natif**.

Pour les dispositions de bundle compatibles, voir [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent différents fichiers manifeste :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement aussi ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les racines
de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` des bundles Claude,
les valeurs par défaut LSP des bundles Claude, ainsi que les packs de hooks pris en charge lorsque la disposition
correspond aux attentes du runtime OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du Plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de Plugin et bloquent la validation de la configuration.

Voir le guide complet du système de Plugin : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit avant de charger le
code de votre Plugin.

Utilisez-le pour :

- l’identité du Plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer le
  runtime du Plugin
- les indications d’activation peu coûteuses que les surfaces du plan de contrôle peuvent inspecter avant le chargement du runtime
- les descripteurs de configuration peu coûteux que les surfaces de configuration/onboarding peuvent inspecter avant le
  chargement du runtime
- les métadonnées d’alias et d’auto-activation qui doivent être résolues avant le chargement du runtime du Plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent auto-activer le
  Plugin avant le chargement du runtime
- les instantanés statiques de propriété de capacité utilisés pour le câblage de compatibilité intégré et
  la couverture des contrats
- les métadonnées peu coûteuses du lanceur QA que l’hôte partagé `openclaw qa` peut inspecter
  avant le chargement du runtime du Plugin
- les métadonnées de configuration spécifiques au canal qui doivent fusionner dans les surfaces
  de catalogue et de validation sans charger le runtime
- les `uiHints` de configuration

Ne l’utilisez pas pour :

- enregistrer un comportement runtime
- déclarer des points d’entrée de code
- des métadonnées d’installation npm

Ces éléments relèvent du code de votre Plugin et de `package.json`.

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
  "description": "Plugin fournisseur OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
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

## Référence des champs de premier niveau

| Champ                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                                    |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | ID canonique du plugin. C’est l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                                                         |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce Plugin.                                                                                                                                                                           |
| `enabledByDefault`                   | Non         | `true`                           | Marque un plugin intégré comme activé par défaut. Omettez-le, ou définissez n’importe quelle valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                            |
| `legacyPluginIds`                    | Non         | `string[]`                       | IDs hérités qui se normalisent vers cet ID canonique de plugin.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | IDs de fournisseur qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou les références de modèle les mentionnent.                                                                      |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de Plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                |
| `channels`                           | Non         | `string[]`                       | IDs de canal détenus par ce Plugin. Utilisés pour la découverte et la validation de configuration.                                                                                                                               |
| `providers`                          | Non         | `string[]`                       | IDs de fournisseur détenus par ce Plugin.                                                                                                                                                                                        |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées de famille de modèles détenues par le manifeste, utilisées pour charger automatiquement le Plugin avant le runtime.                                                                                        |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées détenues par le manifeste sur l’hôte/l’URL de base des endpoints pour les routes fournisseur que le cœur doit classer avant le chargement du runtime fournisseur.                                                   |
| `cliBackends`                        | Non         | `string[]`                       | IDs de backend d’inférence CLI détenus par ce Plugin. Utilisés pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                                          |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique détenu par le Plugin doit être sondé pendant la découverte froide des modèles avant le chargement du runtime.                           |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs de clé API fictives détenues par un plugin intégré qui représentent un état d’identifiants local, OAuth ou ambiant non secret.                                                                                          |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commande détenus par ce Plugin qui doivent produire des diagnostics de configuration et de CLI tenant compte du plugin avant le chargement du runtime.                                                                   |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées légères d’environnement d’authentification fournisseur qu’OpenClaw peut inspecter sans charger le code du Plugin.                                                                                                   |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | IDs de fournisseur qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de code qui partage la clé API du fournisseur de base et les profils d’authentification. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées légères d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez-les pour les surfaces de configuration ou d’authentification de canal pilotées par l’environnement que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des indicateurs CLI.                                                                 |
| `activation`                         | Non         | `object`                         | Indications légères d’activation pour le chargement déclenché par fournisseur, commande, canal, route et capacité. Métadonnées uniquement ; le runtime du Plugin reste propriétaire du comportement réel.                     |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du Plugin.                                                                          |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers de lanceur QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du Plugin.                                                                                                           |
| `contracts`                          | Non         | `object`                         | Instantané statique des capacités intégrées pour les hooks d’authentification externes, la parole, la transcription temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de musique, la génération de vidéos, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les IDs de fournisseur déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                       |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                    |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                                                 |
| `name`                               | Non         | `string`                         | Nom lisible par un humain du Plugin.                                                                                                                                                                                              |
| `description`                        | Non         | `string`                         | Court résumé affiché dans les surfaces du Plugin.                                                                                                                                                                                 |
| `version`                            | Non         | `string`                         | Version informative du Plugin.                                                                                                                                                                                                    |
| `uiHints`                            | Non         | `Record<string, object>`         | Libellés UI, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                                                        |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit cela avant le chargement du runtime fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel appartient ce choix.                                                          |
| `method`              | Oui         | `string`                                        | ID de méthode d’authentification vers laquelle dispatcher.                                             |
| `choiceId`            | Oui         | `string`                                        | ID stable de choix d’authentification utilisé par les flux d’onboarding et de CLI.                    |
| `choiceLabel`         | Non         | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw utilise `choiceId` comme secours.          |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                  |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs les plus basses sont triées en premier dans les sélecteurs interactifs pilotés par assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque ce choix dans les sélecteurs d’assistant tout en autorisant la sélection manuelle en CLI.      |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | IDs hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.             |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                 |
| `groupLabel`          | Non         | `string`                                        | Libellé visible par l’utilisateur pour ce groupe.                                                      |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                     |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul indicateur.                   |
| `cliFlag`             | Non         | `string`                                        | Nom d’indicateur CLI, tel que `--openrouter-api-key`.                                                  |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, telle que `--openrouter-api-key <key>`.                               |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                  |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un Plugin possède un nom de commande runtime que les utilisateurs peuvent
par erreur placer dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code runtime du Plugin.

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

| Champ        | Obligatoire | Type              | Signification                                                             |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce Plugin.                               |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme une commande slash de discussion plutôt qu’une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’activer plus tard.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un Plugin apporte un ou plusieurs lanceurs de transport sous la
racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; le runtime du Plugin
reste propriétaire de l’enregistrement CLI réel via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter la voie QA live Matrix adossée à Docker contre un homeserver jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                     |
| ------------- | ----------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.    |
| `description` | Non         | `string` | Texte d’aide de secours utilisé lorsque l’hôte partagé a besoin d’une commande stub. |

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement runtime, et il
ne remplace pas `register(...)`, `setupEntry` ou d’autres points d’entrée runtime/plugin.
Les consommateurs actuels l’utilisent comme indication de réduction avant un chargement plus large des plugins, donc
l’absence de métadonnées d’activation ne coûte généralement que des performances ; elle ne doit pas
modifier la correction tant que les anciens replis de propriété du manifeste existent encore.

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

| Champ            | Obligatoire | Type                                                 | Signification                                                  |
| ---------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `onProviders`    | Non         | `string[]`                                           | IDs de fournisseur qui doivent activer ce Plugin lorsqu’ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commande qui doivent activer ce Plugin.                 |
| `onChannels`     | Non         | `string[]`                                           | IDs de canal qui doivent activer ce Plugin.                    |
| `onRoutes`       | Non         | `string[]`                                           | Types de route qui doivent activer ce Plugin.                  |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacité utilisées par la planification d’activation du plan de contrôle. |

Consommateurs actifs actuels :

- la planification CLI déclenchée par commande revient aux anciens
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/canal déclenchée par canal revient à l’ancienne propriété `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification de configuration/runtime déclenchée par fournisseur revient à l’ancienne
  propriété `providers[]` et `cliBackends[]` de premier niveau lorsque les métadonnées explicites
  d’activation de fournisseur sont absentes

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées légères
détenues par le Plugin avant le chargement du runtime.

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

Le `cliBackends` de premier niveau reste valide et continue de décrire les
backends d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour
les flux du plan de contrôle/configuration qui doivent rester uniquement basés sur des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` constituent la surface de recherche
préférée orientée descripteur pour la découverte de configuration. Si le descripteur ne fait que réduire
le plugin candidat et que la configuration a toujours besoin de hooks runtime plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme chemin de repli
d’exécution.

Parce que la recherche de configuration peut exécuter du code `setup-api` détenu par le Plugin, les
valeurs normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques globalement parmi les plugins
découverts. Une propriété ambiguë échoue en mode fermé au lieu de choisir un gagnant selon l’ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                       |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | Oui         | `string`   | ID de fournisseur exposé pendant la configuration ou l’onboarding. Gardez les IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthode de configuration/authentification que ce fournisseur prend en charge sans charger le runtime complet. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/état peuvent vérifier avant le chargement du runtime du Plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                     |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration et l’onboarding.   |
| `cliBackends`      | Non         | `string[]` | IDs de backend utilisés au moment de la configuration pour la recherche orientée descripteur. Gardez les IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration détenus par la surface `setup` de ce Plugin.                   |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration nécessite toujours l’exécution de `setup-api` après la recherche par descripteur. |

## Référence `uiHints`

`uiHints` est une map des noms de champs de configuration vers de petites indications de rendu.

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

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                          |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Libellé de champ visible par l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                    |
| `tags`        | `string[]` | Tags UI facultatifs.                   |
| `advanced`    | `boolean`  | Marque le champ comme avancé.          |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte de placeholder pour les entrées de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour des métadonnées statiques de propriété de capacité qu’OpenClaw peut
lire sans importer le runtime du Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs runtime embarqués pour lesquels un plugin intégré peut enregistrer des fabriques. |
| `externalAuthProviders`          | `string[]` | IDs de fournisseur dont ce Plugin possède le hook de profil d’authentification externe. |
| `speechProviders`                | `string[]` | IDs de fournisseur de parole détenus par ce Plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseur de transcription temps réel détenus par ce Plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseur de voix en temps réel détenus par ce Plugin.   |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseur de compréhension des médias détenus par ce Plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseur de génération d’images détenus par ce Plugin.  |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseur de génération de vidéos détenus par ce Plugin. |
| `webFetchProviders`              | `string[]` | IDs de fournisseur de récupération web détenus par ce Plugin.     |
| `webSearchProviders`             | `string[]` | IDs de fournisseur de recherche web détenus par ce Plugin.        |
| `tools`                          | `string[]` | Noms d’outils d’agent détenus par ce Plugin pour les vérifications de contrat intégrées. |

Les plugins fournisseur qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les plugins sans cette déclaration passent encore par
un repli de compatibilité déprécié, mais ce repli est plus lent et
sera supprimé après la fenêtre de migration.

## Référence `mediaUnderstandingProviderMetadata`

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias possède
des modèles par défaut, une priorité de repli automatique d’authentification, ou une prise en charge native de documents dont
les assistants génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
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

Chaque entrée fournisseur peut inclure :

| Champ                  | Type                                | Signification                                                              |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                               |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres les plus faibles sont triés en premier pour le repli automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de document natives prises en charge par le fournisseur.           |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de configuration légères avant
le chargement du runtime.

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

Chaque entrée de canal peut inclure :

| Champ         | Type                     | Signification                                                                          |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Requis pour chaque entrée déclarée de configuration de canal. |
| `uiHints`     | `Record<string, object>` | Libellés UI/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.            |
| `preferOver`  | `string[]`               | IDs de plugin hérités ou à priorité inférieure que ce canal doit surpasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre plugin fournisseur à partir
d’IDs abrégés de modèle comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement du runtime
du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cet ordre de priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers`
  du propriétaire
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un plugin non intégré et un plugin intégré correspondent tous deux, le plugin non intégré
  gagne
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                 |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs abrégés de modèle.                |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs abrégés de modèle après suppression du suffixe de profil. |

Les clés héritées de capacité de premier niveau sont dépréciées. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement
normal du manifeste ne traite plus ces champs de premier niveau comme une
propriété de capacité.

## Manifeste versus `package.json`

Les deux fichiers remplissent des rôles différents :

| Fichier                | Utilisation                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et `uiHints` qui doivent exister avant l’exécution du code du Plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le filtrage d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer un élément de métadonnées, utilisez cette règle :

- si OpenClaw doit le connaître avant de charger le code du Plugin, placez-le dans `openclaw.plugin.json`
- s’il concerne le packaging, les fichiers d’entrée ou le comportement d’installation npm, placez-le dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de Plugin avant runtime vivent intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée de Plugin natifs. Doit rester à l’intérieur du répertoire du package du Plugin.                                                                    |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript compilés pour les packages installés. Doit rester à l’intérieur du répertoire du package du Plugin.                            |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration, utilisé pendant l’onboarding, le démarrage différé de canal et la découverte en lecture seule de l’état de canal/SecretRef. Doit rester à l’intérieur du répertoire du package du Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Doit rester à l’intérieur du répertoire du package du Plugin.                       |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal comme les libellés, chemins de documentation, alias et texte de sélection.                                                           |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification de l’état configuré capables de répondre à « une configuration uniquement par environnement existe-t-elle déjà ? » sans charger tout le runtime du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification de l’authentification persistée capables de répondre à « quelque chose est-il déjà connecté ? » sans charger tout le runtime du canal.     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les plugins intégrés et publiés en externe.                                                                                        |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                        |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, en utilisant un plancher semver tel que `>=2026.3.22`.                                                                   |
| `openclaw.install.expectedIntegrity`                              | Chaîne d’intégrité npm attendue telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à elle.                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation de plugin intégré lorsque la configuration est invalide.                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet au démarrage.                                                         |

Les métadonnées du manifeste déterminent quels choix de fournisseur/canal/configuration apparaissent dans
l’onboarding avant le chargement du runtime. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce plugin lorsque l’utilisateur choisit l’un de ces
choix. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le
chargement du registre de manifeste. Les valeurs invalides sont rejetées ; les valeurs
plus récentes mais valides ignorent le plugin sur les hôtes plus anciens.

L’épinglage exact de version npm se trouve déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Associez-le à
`expectedIntegrity` lorsque vous voulez que les flux de mise à jour échouent en mode fermé si l’artefact
npm récupéré ne correspond plus à la version épinglée. L’onboarding interactif ne
propose des choix d’installation npm à partir de métadonnées de catalogue de confiance que lorsque `npmSpec` est une
version exacte et que `expectedIntegrity` est présent ; sinon il revient à une
source locale ou à un saut.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque l’état, la liste des canaux
ou les scans SecretRef doivent identifier les comptes configurés sans charger tout le
runtime. Le point d’entrée setup doit exposer les métadonnées de canal ainsi que des adaptateurs de configuration,
d’état et de secrets sûrs pour la configuration ; conservez les clients réseau, les écouteurs Gateway et
les runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de frontière de package pour les
champs de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre
chargeable un chemin `openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il
ne rend pas arbitrairement installables des configurations cassées. Aujourd’hui, il permet seulement aux flux d’installation
de récupérer certains échecs obsolètes spécifiques de mise à niveau de plugin intégré, comme un
chemin de plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin intégré. Les erreurs de configuration non liées continuent de bloquer l’installation et renvoient les opérateurs
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

Utilisez-le lorsque les flux de configuration, doctor ou d’état configuré ont besoin d’une
sonde d’authentification simple oui/non avant le chargement du plugin de canal complet. L’export cible doit être une petite
fonction qui lit uniquement l’état persistant ; ne le routez pas via le barrel runtime
complet du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères
d’état configuré uniquement par environnement :

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

Utilisez-le lorsqu’un canal peut déterminer son état configuré à partir de l’environnement ou d’autres petites
entrées non runtime. Si la vérification nécessite une résolution complète de la configuration ou le vrai
runtime du canal, conservez cette logique dans le hook `config.hasConfiguredState` du Plugin à la place.

## Priorité de découverte (IDs de plugin en double)

OpenClaw découvre les plugins depuis plusieurs racines (intégrés, installation globale, espace de travail, chemins explicitement sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifeste de **priorité la plus élevée** est conservé ; les doublons de priorité inférieure sont abandonnés au lieu d’être chargés à côté.

Priorité, de la plus élevée à la plus faible :

1. **Sélectionné par configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Intégré** — plugins fournis avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Espace de travail** — plugins découverts relativement à l’espace de travail actuel

Implications :

- Une copie forkée ou obsolète d’un plugin intégré située dans l’espace de travail ne masquera pas la version intégrée.
- Pour réellement remplacer un plugin intégré par une version locale, épinglez-le via `plugins.entries.<id>` afin qu’il l’emporte par priorité plutôt que de compter sur la découverte dans l’espace de travail.
- Les abandons de doublons sont journalisés afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.

## Comportement de validation

- Les clés inconnues `channels.*` sont des **erreurs**, sauf si l’ID de canal est déclaré par
  un manifeste de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des IDs de Plugin **découvrables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les journaux.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- Le runtime charge toujours le module du Plugin séparément ; le manifeste sert uniquement à
  la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5 ; les commentaires, virgules finales et
  clés non entre guillemets sont donc acceptés tant que la valeur finale reste bien un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d’ajouter
  ici des clés de premier niveau personnalisées.
- `providerAuthEnvVars` est le chemin léger de métadonnées pour les sondes d’authentification, la
  validation des marqueurs d’environnement et les surfaces similaires d’authentification fournisseur qui ne doivent pas démarrer le runtime du Plugin juste pour inspecter les noms d’environnement.
- `providerAuthAliases` permet aux variantes de fournisseur de réutiliser les
  variables d’environnement d’authentification, profils d’authentification, authentification adossée à la configuration et choix
  d’onboarding de clé API d’un autre fournisseur sans coder en dur cette relation dans le cœur.
- `providerEndpoints` permet aux plugins fournisseur de posséder des métadonnées simples de
  correspondance hôte/baseUrl des endpoints. Utilisez-le uniquement pour des classes d’endpoint déjà prises en charge par le cœur ;
  le plugin reste propriétaire du comportement runtime.
- `syntheticAuthRefs` est le chemin léger de métadonnées pour les hooks
  d’authentification synthétique détenus par le fournisseur qui doivent être visibles pour la découverte froide des modèles avant l’existence du registre runtime. Ne listez que les références dont le fournisseur runtime ou le backend CLI implémente réellement
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` est le chemin léger de métadonnées pour les clés API fictives détenues par des plugins intégrés, comme les marqueurs d’identifiants locaux, OAuth ou ambiants.
  Le cœur les traite comme non secrets pour l’affichage de l’authentification et les audits de secrets sans coder en dur le fournisseur propriétaire.
- `channelEnvVars` est le chemin léger de métadonnées pour le repli vers l’environnement du shell, les
  invites de configuration et les surfaces similaires de canal qui ne doivent pas démarrer le runtime du Plugin
  juste pour inspecter les noms d’environnement. Les noms d’environnement sont des métadonnées, pas une activation
  en eux-mêmes : l’état, l’audit, la validation de livraison Cron et d’autres surfaces en lecture seule
  appliquent toujours la politique de confiance et d’activation effective du Plugin avant de
  traiter une variable d’environnement comme un canal configuré.
- `providerAuthChoices` est le chemin léger de métadonnées pour les sélecteurs de choix d’authentification,
  la résolution `--auth-choice`, la mise en correspondance du fournisseur préféré et l’enregistrement simple
  des indicateurs CLI d’onboarding avant le chargement du runtime du fournisseur. Pour les métadonnées runtime d’assistant
  qui nécessitent du code fournisseur, voir
  [Hooks runtime de fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de Plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu’un
  Plugin n’en a pas besoin.
- Si votre Plugin dépend de modules natifs, documentez les étapes de compilation et les
  exigences éventuelles de liste d’autorisation du gestionnaire de paquets (par exemple pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des Plugins](/fr/plugins/building-plugins) — bien démarrer avec les plugins
- [Architecture des Plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de Plugin
