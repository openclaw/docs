---
read_when:
    - Vous construisez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Manifest de Plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifest de Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Cette page concerne **uniquement le manifest natif de Plugin OpenClaw**.

Pour les dispositions de bundle compatibles, voir [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifest différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifest
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes du runtime OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du Plugin**. OpenClaw utilise ce manifest pour valider la configuration
**sans exécuter le code du Plugin**. Les manifests manquants ou invalides sont traités comme
des erreurs de Plugin et bloquent la validation de la configuration.

Voir le guide complet du système de Plugin : [Plugins](/fr/tools/plugin).
Pour le modèle de capacité natif et les indications actuelles de compatibilité externe :
[Modèle de capacité](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` est la métadonnée qu’OpenClaw lit **avant de charger le
code de votre Plugin**. Tout ce qui suit doit être suffisamment léger à inspecter sans démarrer le runtime du
Plugin.

**À utiliser pour :**

- identité du Plugin, validation de configuration et indications d’interface de configuration
- métadonnées d’authentification, d’intégration initiale et de configuration (alias, activation automatique, variables d’environnement fournisseur, choix d’authentification)
- indices d’activation pour les surfaces de plan de contrôle
- propriété abrégée de famille de modèles
- instantanés statiques de propriété de capacité (`contracts`)
- métadonnées d’exécuteur QA que l’hôte partagé `openclaw qa` peut inspecter
- métadonnées de configuration spécifiques aux canaux fusionnées dans les surfaces de catalogue et de validation

**À ne pas utiliser pour :** enregistrer le comportement du runtime, déclarer des points d’entrée de code,
ou des métadonnées d’installation npm. Cela appartient au code de votre Plugin et à `package.json`.

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

| Champ                                | Requis   | Type                             | Signification                                                                                                                                                                                                                      |
| ------------------------------------ | -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui      | `string`                         | Identifiant canonique du Plugin. C’est l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                                         |
| `configSchema`                       | Oui      | `object`                         | Schéma JSON inline pour la configuration de ce Plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Non      | `true`                           | Marque un Plugin intégré comme activé par défaut. Omettez-le, ou définissez toute valeur autre que `true`, pour laisser le Plugin désactivé par défaut.                                                                         |
| `legacyPluginIds`                    | Non      | `string[]`                       | Identifiants hérités qui se normalisent vers cet identifiant canonique de Plugin.                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Non      | `string[]`                       | Identifiants de fournisseurs qui doivent activer automatiquement ce Plugin lorsque l’authentification, la configuration ou les références de modèle les mentionnent.                                                            |
| `kind`                               | Non      | `"memory"` \| `"context-engine"` | Déclare un type exclusif de Plugin utilisé par `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Non      | `string[]`                       | Identifiants de canaux détenus par ce Plugin. Utilisés pour la découverte et la validation de configuration.                                                                                                                     |
| `providers`                          | Non      | `string[]`                       | Identifiants de fournisseurs détenus par ce Plugin.                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Non      | `string`                         | Chemin léger de module de découverte de fournisseur, relatif à la racine du Plugin, pour des métadonnées de catalogue fournisseur à portée manifest pouvant être chargées sans activer le runtime complet du Plugin.          |
| `modelSupport`                       | Non      | `object`                         | Métadonnées abrégées de famille de modèles détenues par le manifest, utilisées pour charger automatiquement le Plugin avant le runtime.                                                                                          |
| `modelCatalog`                       | Non      | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs détenus par ce Plugin. Il s’agit du contrat de plan de contrôle pour lister à l’avenir en lecture seule, l’intégration initiale, les sélecteurs de modèles, les alias et la suppression sans charger le runtime du Plugin. |
| `providerEndpoints`                  | Non      | `object[]`                       | Métadonnées détenues par le manifest sur les hôtes/baseUrl des points de terminaison pour les routes fournisseur que le cœur doit classer avant le chargement du runtime fournisseur.                                          |
| `cliBackends`                        | Non      | `string[]`                       | Identifiants de backend d’inférence CLI détenus par ce Plugin. Utilisés pour l’activation automatique au démarrage à partir de références de configuration explicites.                                                          |
| `syntheticAuthRefs`                  | Non      | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique détenu par le Plugin doit être sondé lors de la découverte à froid des modèles avant le chargement du runtime.                          |
| `nonSecretAuthMarkers`               | Non      | `string[]`                       | Valeurs d’espace réservé de clé API détenues par un Plugin intégré qui représentent un état d’identifiants non secrets local, OAuth ou ambiant.                                                                                  |
| `commandAliases`                     | Non      | `object[]`                       | Noms de commandes détenus par ce Plugin qui doivent produire des diagnostics CLI et de configuration tenant compte du Plugin avant le chargement du runtime.                                                                     |
| `providerAuthEnvVars`                | Non      | `Record<string, string[]>`       | Métadonnées d’environnement de compatibilité obsolètes pour la recherche d’authentification/état des fournisseurs. Préférez `setup.providers[].envVars` pour les nouveaux Plugins ; OpenClaw lit encore cela pendant la fenêtre de dépréciation. |
| `providerAuthAliases`                | Non      | `Record<string, string>`         | Identifiants de fournisseurs qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de codage qui partage la clé API du fournisseur de base et les profils d’authentification. |
| `channelEnvVars`                     | Non      | `Record<string, string[]>`       | Métadonnées légères d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez-les pour des surfaces de configuration ou d’authentification de canal pilotées par l’environnement que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non      | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’intégration initiale, la résolution du fournisseur préféré, et le câblage simple des drapeaux CLI.                                                        |
| `activation`                         | Non      | `object`                         | Métadonnées légères du planificateur d’activation pour le chargement déclenché par fournisseur, commande, canal, route et capacité. Métadonnées uniquement ; le runtime du Plugin garde la responsabilité du comportement réel. |
| `setup`                              | Non      | `object`                         | Descripteurs légers de configuration/intégration initiale que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du Plugin.                                                                |
| `qaRunners`                          | Non      | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du Plugin.                                                                                                          |
| `contracts`                          | Non      | `object`                         | Instantané statique de capacité intégrée pour les hooks d’authentification externes, la parole, la transcription temps réel, la voix temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non      | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les identifiants de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                              |
| `channelConfigs`                     | Non      | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifest, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                     |
| `skills`                             | Non      | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                                                  |
| `name`                               | Non      | `string`                         | Nom lisible du Plugin.                                                                                                                                                                                                             |
| `description`                        | Non      | `string`                         | Résumé court affiché dans les surfaces du Plugin.                                                                                                                                                                                  |
| `version`                            | Non      | `string`                         | Version informative du Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Non      | `Record<string, object>`         | Libellés d’interface, espaces réservés et indices de sensibilité pour les champs de configuration.                                                                                                                                |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’intégration initiale ou d’authentification.
OpenClaw lit cela avant le chargement du runtime fournisseur.
Le flux de configuration du fournisseur préfère ces choix de manifest, puis se replie sur les
métadonnées d’assistant runtime et les choix de catalogue d’installation pour compatibilité.

| Champ                | Requis   | Type                                            | Signification                                                                                             |
| -------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`           | Oui      | `string`                                        | Identifiant de fournisseur auquel appartient ce choix.                                                    |
| `method`             | Oui      | `string`                                        | Identifiant de méthode d’authentification vers lequel dispatcher.                                         |
| `choiceId`           | Oui      | `string`                                        | Identifiant stable de choix d’authentification utilisé par l’intégration initiale et les flux CLI.       |
| `choiceLabel`        | Non      | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw se replie sur `choiceId`.                     |
| `choiceHint`         | Non      | `string`                                        | Court texte d’aide pour le sélecteur.                                                                     |
| `assistantPriority`  | Non      | `number`                                        | Les valeurs les plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par assistant. |
| `assistantVisibility`| Non      | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs d’assistant tout en autorisant la sélection CLI manuelle.            |
| `deprecatedChoiceIds`| Non      | `string[]`                                      | Identifiants hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.      |
| `groupId`            | Non      | `string`                                        | Identifiant de groupe facultatif pour regrouper des choix liés.                                           |
| `groupLabel`         | Non      | `string`                                        | Libellé visible par l’utilisateur pour ce groupe.                                                         |
| `groupHint`          | Non      | `string`                                        | Court texte d’aide pour le groupe.                                                                        |
| `optionKey`          | Non      | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul drapeau.                         |
| `cliFlag`            | Non      | `string`                                        | Nom du drapeau CLI, tel que `--openrouter-api-key`.                                                       |
| `cliOption`          | Non      | `string`                                        | Forme complète de l’option CLI, telle que `--openrouter-api-key <key>`.                                  |
| `cliDescription`     | Non      | `string`                                        | Description utilisée dans l’aide CLI.                                                                     |
| `onboardingScopes`   | Non      | `Array<"text-inference" \| "image-generation">` | Quelles surfaces d’intégration initiale doivent afficher ce choix. Si omis, la valeur par défaut est `["text-inference"]`. |

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

| Champ        | Requis   | Type              | Signification                                                              |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Oui      | `string`          | Nom de commande qui appartient à ce Plugin.                                |
| `kind`       | Non      | `"runtime-slash"` | Marque l’alias comme commande slash de discussion plutôt que commande CLI racine. |
| `cliCommand` | Non      | `string`          | Commande CLI racine liée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/chargement.

Ce bloc correspond à des métadonnées de planificateur, pas à une API de cycle de vie. Il n’enregistre pas
de comportement runtime, ne remplace pas `register(...)`, et ne promet pas que le
code du Plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
restreindre les Plugins candidats avant de se replier sur les métadonnées de propriété existantes du manifest
telles que `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez les métadonnées les plus étroites qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs `setup`, ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour des indices de planificateur supplémentaires
qui ne peuvent pas être représentés par ces champs de propriété.

Ce bloc est constitué uniquement de métadonnées. Il n’enregistre pas le comportement runtime, et il ne
remplace pas `register(...)`, `setupEntry`, ou les autres points d’entrée runtime/Plugin.
Les consommateurs actuels l’utilisent comme indice de restriction avant un chargement plus large du Plugin, donc
des métadonnées d’activation manquantes n’ont généralement qu’un coût de performance ; elles ne doivent pas
modifier la correction tant que les replis de propriété de manifest hérités existent encore.

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

| Champ            | Requis   | Type                                                 | Signification                                                                                             |
| ---------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Non      | `string[]`                                           | Identifiants de fournisseurs qui doivent inclure ce Plugin dans les plans d’activation/chargement.       |
| `onCommands`     | Non      | `string[]`                                           | Identifiants de commandes qui doivent inclure ce Plugin dans les plans d’activation/chargement.          |
| `onChannels`     | Non      | `string[]`                                           | Identifiants de canaux qui doivent inclure ce Plugin dans les plans d’activation/chargement.             |
| `onRoutes`       | Non      | `string[]`                                           | Types de route qui doivent inclure ce Plugin dans les plans d’activation/chargement.                     |
| `onCapabilities` | Non      | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indices larges de capacité utilisés par la planification d’activation du plan de contrôle. Préférez des champs plus étroits lorsque c’est possible. |

Consommateurs live actuels :

- la planification CLI déclenchée par commande se replie sur l’héritage
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification setup/canal déclenchée par canal se replie sur la propriété héritée `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification setup/runtime déclenchée par fournisseur se replie sur l’héritage
  `providers[]` et la propriété de niveau supérieur `cliBackends[]` lorsque les métadonnées explicites
  d’activation fournisseur sont absentes

Les diagnostics du planificateur peuvent distinguer les indices d’activation explicites du repli
sur la propriété du manifest. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` a correspondu, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces libellés de raison servent aux
diagnostics et tests de l’hôte ; les auteurs de Plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un Plugin contribue un ou plusieurs exécuteurs de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; le runtime du Plugin
garde toujours la responsabilité de l’enregistrement réel de la CLI via une surface légère
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

| Champ         | Requis   | Type     | Signification                                                       |
| ------------- | -------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Oui      | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.      |
| `description` | Non      | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande stub. |

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’intégration initiale ont besoin de métadonnées légères
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

Le `cliBackends` de niveau supérieur reste valide et continue à décrire les backends
d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour
les flux setup/plan de contrôle qui doivent rester uniquement basés sur des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface privilégiée de
recherche orientée descripteur pour la découverte setup. Si le descripteur ne fait que
restreindre le Plugin candidat et que setup a toujours besoin de hooks runtime de configuration plus riches,
définissez `requiresRuntime: true` et gardez `setup-api` en place comme
chemin d’exécution de repli.

OpenClaw inclut aussi `setup.providers[].envVars` dans les recherches génériques
d’authentification fournisseur et de variables d’environnement. `providerAuthEnvVars` reste pris en charge via un
adaptateur de compatibilité pendant la fenêtre de dépréciation, mais les Plugins non intégrés qui l’utilisent encore
reçoivent un diagnostic de manifest. Les nouveaux Plugins doivent placer les métadonnées
d’environnement setup/status dans `setup.providers[].envVars`.

OpenClaw peut aussi dériver de simples choix de configuration à partir de `setup.providers[].authMethods`
lorsqu’aucune entrée setup n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare inutile le runtime setup. Les entrées explicites `providerAuthChoices` restent
préférées pour les libellés personnalisés, les drapeaux CLI, la portée de l’intégration initiale et les métadonnées d’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs suffisent pour la
surface setup. OpenClaw traite un `false` explicite comme un contrat uniquement orienté descripteur
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche setup. Si
un Plugin uniquement orienté descripteur fournit néanmoins l’une de ces entrées runtime setup,
OpenClaw signale un diagnostic additif et continue à l’ignorer. L’omission de
`requiresRuntime` conserve le comportement de repli hérité afin que les Plugins existants qui ont ajouté
des descripteurs sans ce drapeau ne cassent pas.

Comme la recherche setup peut exécuter le code `setup-api` détenu par le Plugin, les
valeurs normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les
Plugins découverts. Une propriété ambiguë échoue en mode fermé au lieu de choisir un gagnant
selon l’ordre de découverte.

Lorsque le runtime setup s’exécute effectivement, les diagnostics du registre setup signalent une dérive de descripteur si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs du manifest ne déclarent pas, ou si un descripteur n’a pas d’enregistrement runtime correspondant. Ces diagnostics sont additifs et ne rejettent pas les Plugins hérités.

### Référence `setup.providers`

| Champ         | Requis   | Type       | Signification                                                                            |
| ------------- | -------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | Oui      | `string`   | Identifiant de fournisseur exposé pendant la configuration ou l’intégration initiale. Gardez les identifiants normalisés globalement uniques. |
| `authMethods` | Non      | `string[]` | Identifiants de méthode setup/auth que ce fournisseur prend en charge sans charger le runtime complet. |
| `envVars`     | Non      | `string[]` | Variables d’environnement que les surfaces génériques setup/status peuvent vérifier avant le chargement du runtime du Plugin. |

### Champs `setup`

| Champ              | Requis   | Type       | Signification                                                                                        |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Non      | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration et l’intégration initiale. |
| `cliBackends`      | Non      | `string[]` | Identifiants de backend au moment de la configuration utilisés pour la recherche setup orientée descripteur. Gardez les identifiants normalisés globalement uniques. |
| `configMigrations` | Non      | `string[]` | Identifiants de migration de configuration détenus par la surface setup de ce Plugin.               |
| `requiresRuntime`  | Non      | `boolean`  | Indique si setup a toujours besoin de l’exécution de `setup-api` après la recherche par descripteur. |

## Référence `uiHints`

`uiHints` est un mappage des noms de champs de configuration vers de petits indices de rendu.

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

Chaque indice de champ peut inclure :

| Champ         | Type       | Signification                            |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Libellé de champ visible par l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                      |
| `tags`        | `string[]` | Étiquettes d’interface facultatives.     |
| `advanced`    | `boolean`  | Marque le champ comme avancé.            |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les entrées de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour des métadonnées statiques de propriété de capacité qu’OpenClaw peut
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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                          |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identifiants de fabrique d’extension app-server Codex, actuellement `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identifiants de runtime pour lesquels un Plugin intégré peut enregistrer un middleware de résultat d’outil. |
| `externalAuthProviders`          | `string[]` | Identifiants de fournisseurs dont ce Plugin détient le hook de profil d’authentification externe. |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de parole détenus par ce Plugin.          |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription temps réel détenus par ce Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de voix temps réel détenus par ce Plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants de fournisseurs d’embedding mémoire détenus par ce Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension des médias détenus par ce Plugin. |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d’images détenus par ce Plugin. |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération vidéo détenus par ce Plugin. |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération web détenus par ce Plugin. |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche web détenus par ce Plugin.   |
| `tools`                          | `string[]` | Noms d’outils d’agent détenus par ce Plugin pour les vérifications de contrat intégrées. |

`contracts.embeddedExtensionFactories` est conservé pour les fabriques
d’extension Codex app-server intégrées uniquement. Les transformations de résultat d’outil intégrées doivent
déclarer `contracts.agentToolResultMiddleware` et s’enregistrer avec
`api.registerAgentToolResultMiddleware(...)` à la place. Les Plugins externes ne peuvent pas
enregistrer de middleware de résultat d’outil car cette couture peut réécrire des sorties d’outil
de haute confiance avant que le modèle ne les voie.

Les Plugins fournisseur qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les Plugins sans cette déclaration passent toujours
par un repli de compatibilité obsolète, mais ce repli est plus lent et
sera supprimé après la fenêtre de migration.

Les fournisseurs d’embedding mémoire intégrés doivent déclarer
`contracts.memoryEmbeddingProviders` pour chaque identifiant d’adaptateur qu’ils exposent, y compris
les adaptateurs intégrés tels que `local`. Les chemins CLI autonomes utilisent ce contrat de manifest pour ne charger que le Plugin propriétaire avant que le runtime Gateway complet n’ait
enregistré les fournisseurs.

## Référence `mediaUnderstandingProviderMetadata`

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias possède
des modèles par défaut, une priorité de repli d’authentification automatique, ou une prise en charge native des documents dont les assistants génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
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

| Champ                  | Type                                | Signification                                                                 |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                                  |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres les plus faibles sont triés plus tôt pour le repli automatique de fournisseur adossé à des identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de document natives prises en charge par le fournisseur.              |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu’un Plugin de canal a besoin de métadonnées de configuration légères avant le
chargement du runtime. La découverte setup/status de canal en lecture seule peut utiliser directement ces métadonnées
pour des canaux externes configurés lorsqu’aucune entrée setup n’est disponible, ou
lorsque `setup.requiresRuntime: false` déclare le runtime setup inutile.

Pour un Plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les Plugins non intégrés qui déclarent `channels[]` doivent aussi déclarer des entrées
`channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le Plugin, mais les surfaces de schéma de configuration à froid, de setup et d’interface de contrôle ne peuvent pas connaître la forme des options détenues par le canal avant l’exécution du runtime du Plugin.

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

| Champ         | Type                     | Signification                                                                                |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Requis pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés d’interface/espaces réservés/indices de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Description courte du canal pour les surfaces d’inspection et de catalogue.                  |
| `preferOver`  | `string[]`               | Identifiants de Plugin hérités ou de priorité inférieure que ce canal doit supplanter dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre Plugin fournisseur à partir
d’identifiants de modèle abrégés comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement du runtime du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifest `providers` propriétaires
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un Plugin non intégré et un Plugin intégré correspondent tous les deux, le Plugin non intégré
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes mis en correspondance avec `startsWith` contre les identifiants de modèle abrégés. |
| `modelPatterns` | `string[]` | Sources regex mises en correspondance avec les identifiants de modèle abrégés après suppression du suffixe de profil. |

## Référence `modelCatalog`

Utilisez `modelCatalog` lorsqu’OpenClaw doit connaître les métadonnées de modèle fournisseur avant le
chargement du runtime du Plugin. Il s’agit de la source détenue par le manifest pour les lignes fixes
de catalogue, les alias de fournisseur, les règles de suppression et le mode de découverte. L’actualisation runtime
appartient toujours au code runtime du fournisseur, mais le manifest indique au cœur quand le runtime
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
        "reason": "non disponible sur Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Champs de niveau supérieur :

| Champ          | Type                                                     | Signification                                                                                                 |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Lignes de catalogue pour les identifiants de fournisseurs détenus par ce Plugin. Les clés doivent aussi apparaître dans le `providers` de niveau supérieur. |
| `aliases`      | `Record<string, object>`                                 | Alias de fournisseurs qui doivent se résoudre vers un fournisseur détenu pour la planification du catalogue ou de la suppression. |
| `suppressions` | `object[]`                                               | Lignes de modèle provenant d’une autre source que ce Plugin supprime pour une raison spécifique au fournisseur. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue fournisseur peut être lu depuis les métadonnées du manifest, actualisé dans le cache, ou s’il nécessite le runtime. |

Champs fournisseur :

| Champ     | Type                     | Signification                                                        |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL de base facultative par défaut pour les modèles de ce catalogue fournisseur. |
| `api`     | `ModelApi`               | Adaptateur API facultatif par défaut pour les modèles de ce catalogue fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques facultatifs qui s’appliquent à ce catalogue fournisseur. |
| `models`  | `object[]`               | Lignes de modèle requises. Les lignes sans `id` sont ignorées.       |

Champs modèle :

| Champ           | Type                                                           | Signification                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Identifiant de modèle local au fournisseur, sans le préfixe `provider/`.  |
| `name`          | `string`                                                       | Nom d’affichage facultatif.                                                |
| `api`           | `ModelApi`                                                     | Remplacement API facultatif par modèle.                                    |
| `baseUrl`       | `string`                                                       | Remplacement facultatif de l’URL de base par modèle.                       |
| `headers`       | `Record<string, string>`                                       | En-têtes statiques facultatifs par modèle.                                 |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modalités acceptées par le modèle.                                         |
| `reasoning`     | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.               |
| `contextWindow` | `number`                                                       | Fenêtre de contexte native du fournisseur.                                 |
| `contextTokens` | `number`                                                       | Plafond de contexte effectif facultatif à l’exécution lorsqu’il diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de jetons de sortie lorsqu’il est connu.                    |
| `cost`          | `object`                                                       | Tarification facultative en USD par million de jetons, incluant `tieredPricing` facultatif. |
| `compat`        | `object`                                                       | Drapeaux de compatibilité facultatifs correspondant à la compatibilité de configuration de modèle OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | État de listing. Ne supprimez que lorsque la ligne ne doit pas apparaître du tout. |
| `statusReason`  | `string`                                                       | Raison facultative affichée avec un état non disponible.                   |
| `replaces`      | `string[]`                                                     | Anciens identifiants de modèle locaux au fournisseur que ce modèle remplace. |
| `replacedBy`    | `string`                                                       | Identifiant de modèle local au fournisseur de remplacement pour les lignes obsolètes. |
| `tags`          | `string[]`                                                     | Étiquettes stables utilisées par les sélecteurs et les filtres.            |

Ne mettez pas de données uniquement runtime dans `modelCatalog`. Si un fournisseur a besoin de l’état du compte,
d’une requête API, ou de la découverte d’un processus local pour connaître l’ensemble complet de modèles,
déclarez ce fournisseur comme `refreshable` ou `runtime` dans `discovery`.

Les clés de capacité héritées de niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, et `webSearchProviders` sous `contracts` ; le chargement
normal du manifest ne traite plus ces champs de niveau supérieur comme
propriété de capacité.

## Manifest versus package.json

Les deux fichiers remplissent des rôles différents :

| Fichier                | À utiliser pour                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification, et indices d’interface qui doivent exister avant l’exécution du code du Plugin |
| `package.json`         | Métadonnées npm, installation de dépendances, et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où une métadonnée doit aller, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du Plugin, mettez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers de point d’entrée, ou le comportement d’installation npm, mettez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de Plugin avant runtime vivent intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée natifs de Plugin. Doit rester dans le répertoire du package Plugin.                                                                                      |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript construits pour les packages installés. Doit rester dans le répertoire du package Plugin.                                           |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration utilisé pendant l’intégration initiale, le démarrage différé des canaux, et la découverte en lecture seule de l’état de canal/SecretRef. Doit rester dans le répertoire du package Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée setup JavaScript construit pour les packages installés. Doit rester dans le répertoire du package Plugin.                                                 |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal comme les libellés, chemins de documentation, alias, et texte de sélection.                                                               |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification d’état configuré capables de répondre à « une configuration uniquement environnement existe-t-elle déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification d’authentification persistée capables de répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal.         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indices d’installation/mise à jour pour les Plugins intégrés et publiés en externe.                                                                                                  |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                              |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, avec un plancher semver tel que `>=2026.3.22`.                                                                                |
| `openclaw.install.expectedIntegrity`                              | Chaîne d’intégrité npm attendue telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à elle.                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation de Plugin intégré lorsque la configuration est invalide.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le Plugin de canal complet au démarrage.                                                               |

Les métadonnées du manifest décident quels choix de fournisseur/canal/setup apparaissent dans
l’intégration initiale avant le chargement du runtime. `package.json#openclaw.install` indique à
l’intégration initiale comment récupérer ou activer ce Plugin lorsque l’utilisateur choisit l’un de ces
choix. Ne déplacez pas les indices d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du
registre de manifests. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides ignorent le
Plugin sur les hôtes plus anciens.

L’épinglage exact de version npm vit déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles du catalogue externe
doivent associer des spécifications exactes à `expectedIntegrity` afin que les flux de mise à jour échouent en
mode fermé si l’artefact npm récupéré ne correspond plus à la version épinglée.
L’intégration initiale interactive continue de proposer des spécifications npm de registre de confiance, y compris des noms de package nus et des dist-tags, pour compatibilité. Les diagnostics du catalogue peuvent
distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec
incohérence de nom de package, et les sources de choix par défaut invalides. Ils avertissent aussi lorsque
`expectedIntegrity` est présent mais qu’il n’existe pas de source npm valide qu’il puisse épingler.
Lorsque `expectedIntegrity` est présent,
les flux d’installation/mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est
enregistrée sans épinglage d’intégrité.

Les Plugins de canal doivent fournir `openclaw.setupEntry` lorsque l’état, la liste des canaux,
ou les analyses SecretRef doivent identifier les comptes configurés sans charger le runtime complet.
L’entrée setup doit exposer les métadonnées du canal ainsi que des adaptateurs sûrs pour la configuration, l’état et les secrets ; gardez les clients réseau, les écouteurs Gateway et les runtimes de transport
dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de limites de package pour les champs de point d’entrée source.
Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un
chemin `openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est intentionnellement étroit. Il ne
rend pas installables des configurations cassées arbitraires. Aujourd’hui il permet seulement aux flux d’installation de récupérer de défaillances spécifiques de mise à niveau de Plugin intégré obsolète, telles qu’un chemin de Plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même Plugin intégré. Les erreurs de configuration sans rapport bloquent toujours l’installation et redirigent les opérateurs vers `openclaw doctor --fix`.

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

Utilisez-le lorsque les flux setup, doctor ou configured-state ont besoin d’une
sonde d’authentification oui/non peu coûteuse avant le chargement du Plugin de canal complet. L’export cible doit être une petite fonction qui lit uniquement l’état persisté ; ne le faites pas passer par le barrel runtime complet du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications peu coûteuses d’état configuré uniquement par environnement :

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

Utilisez-le lorsqu’un canal peut répondre à configured-state à partir de l’environnement ou d’autres
petites entrées non runtime. Si la vérification nécessite une résolution complète de configuration ou le vrai
runtime du canal, conservez cette logique dans le hook `config.hasConfiguredState`
du Plugin à la place.

## Priorité de découverte (identifiants de Plugin dupliqués)

OpenClaw découvre les Plugins depuis plusieurs racines (intégrés, installation globale, espace de travail, chemins explicitement sélectionnés par configuration). Si deux découvertes partagent le même `id`, seul le manifest de **priorité la plus élevée** est conservé ; les doublons de priorité inférieure sont supprimés au lieu d’être chargés à côté.

Priorité, de la plus élevée à la plus faible :

1. **Sélectionné par configuration** — chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Intégré** — Plugins fournis avec OpenClaw
3. **Installation globale** — Plugins installés dans la racine globale des Plugins OpenClaw
4. **Espace de travail** — Plugins découverts relativement à l’espace de travail courant

Conséquences :

- Une copie forkée ou obsolète d’un Plugin intégré présente dans l’espace de travail ne masquera pas la build intégrée.
- Pour réellement remplacer un Plugin intégré par un Plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il l’emporte par priorité au lieu de vous appuyer sur la découverte d’espace de travail.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque Plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, et non à l’exécution.

## Comportement de validation

- Les clés inconnues `channels.*` sont des **erreurs**, sauf si l’identifiant de canal est déclaré par
  un manifest de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, et `plugins.slots.*`
  doivent référencer des identifiants de Plugin **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifest ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est remonté dans Doctor + les journaux.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifest est **requis pour les Plugins OpenClaw natifs**, y compris les chargements locaux depuis le système de fichiers. Le runtime charge toujours séparément le module du Plugin ; le manifest sert uniquement à la découverte + validation.
- Les manifests natifs sont analysés avec JSON5, donc les commentaires, virgules finales et clés non citées sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifest documentés sont lus par le chargeur de manifest. Évitez les clés personnalisées de niveau supérieur.
- `channels`, `providers`, `cliBackends`, et `skills` peuvent tous être omis lorsqu’un Plugin n’en a pas besoin.
- `providerDiscoveryEntry` doit rester léger et ne doit pas importer de code runtime large ; utilisez-le pour des métadonnées statiques de catalogue fournisseur ou des descripteurs de découverte étroits, pas pour une exécution au moment de la requête.
- Les types exclusifs de Plugin sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (valeur par défaut `legacy`).
- Les métadonnées de variable d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` obsolète, et `channelEnvVars`) sont uniquement déclaratives. Les surfaces de statut, d’audit, de validation de remise Cron et autres surfaces en lecture seule appliquent toujours la confiance du Plugin et la politique d’activation effective avant de traiter une variable d’environnement comme configurée.
- Pour les métadonnées d’assistant runtime qui nécessitent le code fournisseur, voir [Hooks runtime du fournisseur](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre Plugin dépend de modules natifs, documentez les étapes de build et toute exigence de liste d’autorisation du gestionnaire de package (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Liens associés

<CardGroup cols={3}>
  <Card title="Créer des Plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Démarrer avec les Plugins.
  </Card>
  <Card title="Architecture des Plugins" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacité.
  </Card>
  <Card title="Vue d’ensemble du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK Plugin et imports de sous-chemin.
  </Card>
</CardGroup>
