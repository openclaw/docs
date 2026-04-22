---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez fournir un schéma de configuration de plugin ou déboguer des erreurs de validation de plugin
summary: Manifest de Plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifest de Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest de Plugin (`openclaw.plugin.json`)

Cette page concerne **uniquement le manifest de Plugin natif OpenClaw**.

Pour les dispositions de bundles compatibles, voir [Bundles de Plugins](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers manifest différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifest
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement ces dispositions de bundle également, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle plus les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes du runtime OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du Plugin**. OpenClaw utilise ce manifest pour valider la configuration
**sans exécuter le code du Plugin**. Les manifests absents ou invalides sont traités comme
des erreurs de Plugin et bloquent la validation de la configuration.

Voir le guide complet du système de Plugin : [Plugins](/fr/tools/plugin).
Pour le modèle de capacité natif et les indications actuelles de compatibilité externe :
[Modèle de capacité](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` est la métadonnée qu’OpenClaw lit avant de charger le
code de votre Plugin.

Utilisez-le pour :

- l’identité du Plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer le runtime du Plugin
- les indications d’activation peu coûteuses que les surfaces de plan de contrôle peuvent inspecter avant le chargement du runtime
- les descripteurs de configuration peu coûteux que les surfaces de configuration/onboarding peuvent inspecter avant le chargement du runtime
- les métadonnées d’alias et d’activation automatique qui doivent être résolues avant le chargement du runtime du Plugin
- les métadonnées abrégées d’appartenance à une famille de modèles qui doivent activer automatiquement le
  Plugin avant le chargement du runtime
- les instantanés statiques d’appartenance de capacité utilisés pour le câblage de compatibilité intégré et
  la couverture de contrat
- les métadonnées peu coûteuses du runner QA que l’hôte partagé `openclaw qa` peut inspecter
  avant le chargement du runtime du Plugin
- les métadonnées de configuration spécifiques à un canal qui doivent être fusionnées dans les surfaces de catalogue
  et de validation sans charger le runtime
- les indications d’interface de configuration

Ne l’utilisez pas pour :

- enregistrer un comportement runtime
- déclarer des points d’entrée de code
- des métadonnées d’installation npm

Ces éléments relèvent de votre code de Plugin et de `package.json`.

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

## Exemple enrichi

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

## Référence des champs de niveau supérieur

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                                                |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Oui         | `string`                         | Identifiant canonique du Plugin. C’est l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                   |
| `configSchema`                      | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce Plugin.                                                                                                                                                       |
| `enabledByDefault`                  | Non         | `true`                           | Marque un Plugin intégré comme activé par défaut. Omettez-le, ou définissez toute valeur autre que `true`, pour laisser le Plugin désactivé par défaut.                                                   |
| `legacyPluginIds`                   | Non         | `string[]`                       | Identifiants hérités normalisés vers cet identifiant canonique de Plugin.                                                                                                                                    |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | Identifiants de fournisseur qui doivent activer automatiquement ce Plugin lorsque l’authentification, la configuration ou les références de modèle les mentionnent.                                        |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de Plugin utilisé par `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Non         | `string[]`                       | Identifiants de canal pris en charge par ce Plugin. Utilisés pour la découverte et la validation de configuration.                                                                                          |
| `providers`                         | Non         | `string[]`                       | Identifiants de fournisseur pris en charge par ce Plugin.                                                                                                                                                    |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de famille de modèles gérées par le manifest et utilisées pour charger automatiquement le Plugin avant le runtime.                                                                     |
| `providerEndpoints`                 | Non         | `object[]`                       | Métadonnées gérées par le manifest sur les hôtes/baseUrl de points de terminaison pour les routes de fournisseur que le core doit classifier avant le chargement du runtime du fournisseur.                 |
| `cliBackends`                       | Non         | `string[]`                       | Identifiants de backend d’inférence CLI pris en charge par ce Plugin. Utilisés pour l’auto-activation au démarrage à partir de références explicites de configuration.                                     |
| `syntheticAuthRefs`                 | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique géré par le Plugin doit être sondé pendant la découverte à froid des modèles avant le chargement du runtime.       |
| `nonSecretAuthMarkers`              | Non         | `string[]`                       | Valeurs de clé API factices gérées par le Plugin intégré qui représentent un état d’identifiants local, OAuth ou ambiant non secret.                                                                        |
| `commandAliases`                    | Non         | `object[]`                       | Noms de commande pris en charge par ce Plugin qui doivent produire une configuration tenant compte du Plugin et des diagnostics CLI avant le chargement du runtime.                                         |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées peu coûteuses d’authentification fournisseur via variables d’environnement qu’OpenClaw peut inspecter sans charger le code du Plugin.                                                          |
| `providerAuthAliases`               | Non         | `Record<string, string>`         | Identifiants de fournisseur qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de coding qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                    | Non         | `Record<string, string[]>`       | Métadonnées peu coûteuses de canal via variables d’environnement qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez-les pour la configuration de canal pilotée par environnement ou pour les surfaces d’authentification que les aides génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées peu coûteuses de choix d’authentification pour les sélecteurs d’onboarding, la résolution de fournisseur préféré et le câblage simple des indicateurs CLI.                                    |
| `activation`                        | Non         | `object`                         | Indications d’activation peu coûteuses pour le chargement déclenché par un fournisseur, une commande, un canal, une route ou une capacité. Métadonnées uniquement ; le runtime du Plugin conserve le comportement réel. |
| `setup`                             | Non         | `object`                         | Descripteurs de configuration/onboarding peu coûteux que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du Plugin.                                               |
| `qaRunners`                         | Non         | `object[]`                       | Descripteurs peu coûteux de runner QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du Plugin.                                                                                  |
| `contracts`                         | Non         | `object`                         | Instantané statique des capacités intégrées pour la parole, la transcription temps réel, la voix temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, la récupération Web, la recherche Web et la propriété des outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal gérées par le manifest, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                  |
| `skills`                            | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                             |
| `name`                              | Non         | `string`                         | Nom lisible du Plugin.                                                                                                                                                                                        |
| `description`                       | Non         | `string`                         | Résumé court affiché dans les surfaces du Plugin.                                                                                                                                                             |
| `version`                           | Non         | `string`                         | Version informative du Plugin.                                                                                                                                                                                |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés UI, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                                    |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit ceci avant le chargement du runtime du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | Identifiant du fournisseur auquel ce choix appartient.                                                     |
| `method`              | Oui         | `string`                                        | Identifiant de méthode d’authentification vers lequel dispatcher.                                          |
| `choiceId`            | Oui         | `string`                                        | Identifiant stable de choix d’authentification utilisé par les flux d’onboarding et CLI.                  |
| `choiceLabel`         | Non         | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw se replie sur `choiceId`.                      |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                      |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant.    |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix des sélecteurs de l’assistant tout en autorisant la sélection manuelle via CLI.           |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Anciens identifiants de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.       |
| `groupId`             | Non         | `string`                                        | Identifiant de groupe optionnel pour regrouper des choix liés.                                             |
| `groupLabel`          | Non         | `string`                                        | Libellé visible par l’utilisateur pour ce groupe.                                                          |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                         |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul indicateur.                       |
| `cliFlag`             | Non         | `string`                                        | Nom d’indicateur CLI, comme `--openrouter-api-key`.                                                        |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, comme `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                      |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un Plugin prend en charge un nom de commande runtime que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
utilise cette métadonnée pour les diagnostics sans importer le code runtime du Plugin.

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
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme une commande slash de chat plutôt qu’une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine liée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’activer plus tard.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un Plugin apporte un ou plusieurs runners de transport sous
la racine partagée `openclaw qa`. Gardez cette métadonnée légère et statique ; le runtime du Plugin
conserve l’enregistrement CLI réel via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter la voie QA live Matrix adossée à Docker sur un homeserver jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                         |
| ------------- | ----------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.        |
| `description` | Non         | `string` | Texte d’aide de secours utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

Ce bloc est uniquement une métadonnée. Il n’enregistre pas de comportement runtime et
ne remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée runtime/Plugin.
Les consommateurs actuels l’utilisent comme indication de filtrage avant un chargement plus large des Plugins, donc
l’absence de métadonnées d’activation ne coûte généralement que des performances ; elle ne doit pas
modifier la correction tant que les replis hérités de propriété du manifest existent encore.

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

| Champ            | Obligatoire | Type                                                 | Signification                                                       |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Non         | `string[]`                                           | Identifiants de fournisseur qui doivent activer ce Plugin lorsqu’ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | Identifiants de commande qui doivent activer ce Plugin.             |
| `onChannels`     | Non         | `string[]`                                           | Identifiants de canal qui doivent activer ce Plugin.                |
| `onRoutes`       | Non         | `string[]`                                           | Types de route qui doivent activer ce Plugin.                       |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacité utilisées par la planification d’activation du plan de contrôle. |

Consommateurs live actuels :

- la planification CLI déclenchée par commande se replie sur les anciens
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/canal déclenchée par canal se replie sur l’ancienne
  propriété `channels[]` lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification de configuration/runtime déclenchée par fournisseur se replie sur l’ancienne
  propriété `providers[]` et `cliBackends[]` de niveau supérieur lorsque les métadonnées explicites d’activation du fournisseur sont absentes

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées légères prises en charge par le Plugin
avant le chargement du runtime.

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

Le champ de niveau supérieur `cliBackends` reste valide et continue de décrire les backends
d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour
les flux de plan de contrôle/configuration qui doivent rester purement métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` constituent la surface de recherche
préférée, d’abord par descripteur, pour la découverte de configuration. Si le descripteur ne fait que
restreindre le Plugin candidat et que la configuration a encore besoin de hooks runtime plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme chemin d’exécution de secours.

Comme la recherche de configuration peut exécuter le code `setup-api` pris en charge par le Plugin, les valeurs normalisées
`setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les
Plugins découverts. Une propriété ambiguë échoue de manière fermée au lieu de choisir un gagnant selon l’ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Oui         | `string`   | Identifiant de fournisseur exposé pendant la configuration ou l’onboarding. Gardez des identifiants normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | Identifiants de méthode de configuration/authentification que ce fournisseur prend en charge sans charger le runtime complet. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/état peuvent vérifier avant le chargement du runtime du Plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration et l’onboarding.      |
| `cliBackends`      | Non         | `string[]` | Identifiants de backend au moment de la configuration, utilisés pour la recherche de configuration d’abord par descripteur. Gardez des identifiants normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | Identifiants de migration de configuration pris en charge par la surface de configuration de ce Plugin. |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration a encore besoin de l’exécution de `setup-api` après la recherche par descripteur. |

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

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                            |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Libellé du champ visible par l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                      |
| `tags`        | `string[]` | Tags UI optionnels.                      |
| `advanced`    | `boolean`  | Marque le champ comme avancé.            |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte indicatif pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour des métadonnées statiques de propriété de capacité qu’OpenClaw peut
lire sans importer le runtime du Plugin.

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

Chaque liste est optionnelle :

| Champ                            | Type       | Signification                                                   |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de parole pris en charge par ce Plugin. |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription temps réel pris en charge par ce Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de voix temps réel pris en charge par ce Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension des médias pris en charge par ce Plugin. |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d’images pris en charge par ce Plugin. |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération vidéo pris en charge par ce Plugin. |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération Web pris en charge par ce Plugin. |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche Web pris en charge par ce Plugin. |
| `tools`                          | `string[]` | Noms des outils d’agent pris en charge par ce Plugin pour les vérifications de contrat intégrées. |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu’un Plugin de canal a besoin de métadonnées de configuration légères avant
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

Chaque entrée de canal peut inclure :

| Champ         | Type                     | Signification                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés UI/placeholders/indications de sensibilité optionnels pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Description courte du canal pour les surfaces d’inspection et de catalogue.                   |
| `preferOver`  | `string[]`               | Identifiants de Plugin hérités ou de priorité inférieure que ce canal doit dépasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre Plugin fournisseur à partir
d’identifiants abrégés de modèle comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement
du runtime du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cet ordre de priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifest `providers` du propriétaire
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un Plugin non intégré et un Plugin intégré correspondent tous deux, le Plugin non intégré
  l’emporte
- toute ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants abrégés de modèle.          |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants abrégés de modèle après suppression du suffixe de profil. |

Les anciennes clés de capacité de niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifest ne traite plus ces champs de niveau supérieur comme une propriété
de capacité.

## Manifest versus package.json

Les deux fichiers ont des rôles différents :

| Fichier                | Utilisation                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications UI qui doivent exister avant l’exécution du code du Plugin |
| `package.json`         | Métadonnées npm, installation des dépendances, et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du Plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers de point d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de Plugin pré-runtime résident intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Déclare les points d’entrée de Plugin natifs. Doit rester dans le répertoire du package du Plugin.                                                                                  |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript compilés pour les packages installés. Doit rester dans le répertoire du package du Plugin.                                          |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration utilisé pendant l’onboarding, le démarrage différé des canaux et la découverte en lecture seule de l’état du canal/SecretRef. Doit rester dans le répertoire du package du Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Doit rester dans le répertoire du package du Plugin.                                    |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal telles que libellés, chemins de documentation, alias et texte de sélection.                                                              |
| `openclaw.channel.configuredState`                                | Métadonnées légères du vérificateur d’état configuré capables de répondre à « une configuration uniquement par env existe-t-elle déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères du vérificateur d’authentification persistée capables de répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal.         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les Plugins intégrés et publiés de façon externe.                                                                                       |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                             |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, utilisant un plancher semver comme `>=2026.3.22`.                                                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin de récupération étroit de réinstallation de Plugin intégré lorsque la configuration est invalide.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le Plugin de canal complet au démarrage.                                                              |

`openclaw.install.minHostVersion` est appliqué lors de l’installation et du chargement du registre
de manifests. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides ignorent le
Plugin sur les hôtes plus anciens.

Les Plugins de canal doivent fournir `openclaw.setupEntry` lorsque l’état, la liste de canaux,
ou les analyses SecretRef doivent identifier les comptes configurés sans charger le runtime complet.
Le point d’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs sûrs pour la configuration,
l’état et les secrets ; gardez les clients réseau, écouteurs Gateway et
runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de frontière de package pour les champs
de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable
un chemin `openclaw.extensions` qui s’échappe du package.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il ne
rend pas installables des configurations cassées arbitraires. Aujourd’hui, il permet uniquement aux flux d’installation
de récupérer à partir de certains échecs obsolètes de mise à niveau de Plugins intégrés, comme un
chemin de Plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même
Plugin intégré. Les erreurs de configuration non liées continuent de bloquer l’installation et orientent les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule
module vérificateur :

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
sonde binaire légère d’authentification avant le chargement du Plugin de canal complet. L’export cible doit être une petite
fonction qui lit uniquement l’état persisté ; ne le faites pas transiter par le barrel runtime complet
du canal.

`openclaw.channel.configuredState` suit la même forme pour les vérifications légères
de configuration uniquement par env :

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

Utilisez-le lorsqu’un canal peut répondre à l’état configuré à partir d’env ou d’autres entrées
minimales non runtime. Si la vérification nécessite une résolution complète de configuration ou le vrai
runtime du canal, gardez cette logique dans le hook `config.hasConfiguredState` du Plugin à la place.

## Priorité de découverte (identifiants de Plugin dupliqués)

OpenClaw découvre des Plugins à partir de plusieurs racines (intégrés, installation globale, espace de travail, chemins explicitement sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifest à la **priorité la plus élevée** est conservé ; les doublons de priorité inférieure sont supprimés au lieu d’être chargés à côté.

Ordre de priorité, du plus élevé au plus faible :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Intégré** — plugins fournis avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Espace de travail** — plugins découverts par rapport à l’espace de travail actuel

Implications :

- Une copie forkée ou obsolète d’un plugin intégré présente dans l’espace de travail ne masquera pas le build intégré.
- Pour réellement remplacer un plugin intégré par un plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par priorité au lieu de vous appuyer sur la découverte dans l’espace de travail.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque Plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas au runtime.

## Comportement de validation

- Les clés inconnues `channels.*` sont des **erreurs**, sauf si l’identifiant du canal est déclaré par
  un manifest de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des identifiants de Plugin **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifest ou un schéma cassé ou absent,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor + les journaux.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifest est **obligatoire pour les Plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- Le runtime charge toujours séparément le module du Plugin ; le manifest sert uniquement à
  la découverte + la validation.
- Les manifests natifs sont analysés avec JSON5, donc les commentaires, virgules finales et
  clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifest documentés sont lus par le chargeur de manifest. Évitez d’ajouter
  ici des clés de niveau supérieur personnalisées.
- `providerAuthEnvVars` est le chemin de métadonnées léger pour les sondes d’authentification, la
  validation des marqueurs d’environnement et les surfaces similaires d’authentification fournisseur qui ne doivent pas démarrer le runtime du Plugin juste pour inspecter les noms d’env.
- `providerAuthAliases` permet aux variantes de fournisseur de réutiliser les variables d’environnement d’authentification,
  profils d’authentification, authentification soutenue par la configuration et choix d’onboarding par clé API d’un autre fournisseur
  sans coder en dur cette relation dans le core.
- `providerEndpoints` permet aux plugins fournisseur de prendre en charge des métadonnées simples de correspondance
  hôte/baseUrl de point de terminaison. Utilisez-le uniquement pour les classes de point de terminaison déjà prises en charge par le core ;
  le Plugin conserve le comportement runtime.
- `syntheticAuthRefs` est le chemin de métadonnées léger pour les hooks d’authentification synthétique pris en charge par le fournisseur
  qui doivent être visibles à la découverte à froid des modèles avant l’existence du registre runtime. Listez uniquement les références dont le fournisseur runtime ou le backend CLI implémente réellement
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` est le chemin de métadonnées léger pour les clés API factices
  prises en charge par les plugins intégrés, comme les marqueurs d’identifiants locaux, OAuth ou ambiants.
  Le core les traite comme non secrets pour l’affichage d’authentification et les audits de secrets sans
  coder en dur le fournisseur propriétaire.
- `channelEnvVars` est le chemin de métadonnées léger pour le repli vers l’environnement du shell, les
  invites de configuration et les surfaces similaires de canal qui ne doivent pas démarrer le runtime du Plugin
  juste pour inspecter les noms d’env. Les noms d’env sont des métadonnées, pas une activation en
  soi : l’état, l’audit, la validation de remise Cron et les autres surfaces en lecture seule
  appliquent toujours la politique de confiance du Plugin et d’activation effective avant de
  traiter une variable d’environnement comme un canal configuré.
- `providerAuthChoices` est le chemin de métadonnées léger pour les sélecteurs de choix d’authentification,
  la résolution `--auth-choice`, le mappage du fournisseur préféré et l’enregistrement simple
  des indicateurs CLI d’onboarding avant le chargement du runtime du fournisseur. Pour les métadonnées runtime d’assistant
  qui nécessitent du code fournisseur, voir
  [Hooks runtime de fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de Plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu’un
  Plugin n’en a pas besoin.
- Si votre Plugin dépend de modules natifs, documentez les étapes de build et toute
  exigence de liste d’autorisation du gestionnaire de packages (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des Plugins](/fr/plugins/building-plugins) — prise en main des plugins
- [Architecture des Plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
