---
read_when:
    - Vous construisez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Manifeste de Plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifeste de Plugin
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:35:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Cette page concerne uniquement le **manifeste de Plugin OpenClaw natif**.

Pour les dispositions de bundles compatibles, voir [Plugin bundles](/fr/plugins/bundles).

Les formats de bundles compatibles utilisent différents fichiers de manifeste :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement aussi ces dispositions de bundles, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes du runtime OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du Plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du Plugin**. Les manifestes absents ou invalides sont traités comme
des erreurs de Plugin et bloquent la validation de la configuration.

Voir le guide complet du système de Plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Capability model](/fr/plugins/architecture#public-capability-model).

## Rôle de ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit **avant de charger le
code de votre Plugin**. Tout ce qui suit doit être suffisamment peu coûteux à inspecter sans démarrer
le runtime du Plugin.

**À utiliser pour :**

- identité du Plugin, validation de configuration et indications d’UI de configuration
- métadonnées d’authentification, d’onboarding et de configuration (alias, activation automatique, variables d’environnement de fournisseur, choix d’authentification)
- indications d’activation pour les surfaces du plan de contrôle
- propriété abrégée de familles de modèles
- instantanés statiques de propriété de capacité (`contracts`)
- métadonnées d’exécuteur QA que l’hôte partagé `openclaw qa` peut inspecter
- métadonnées de configuration spécifiques aux canaux fusionnées dans les surfaces de catalogue et de validation

**À ne pas utiliser pour :** enregistrer le comportement d’exécution, déclarer des points d’entrée de code,
ou des métadonnées d’installation npm. Ces éléments appartiennent à votre code de Plugin et à `package.json`.

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

| Champ                                | Requis | Type                             | Signification                                                                                                                                                                                                                     |
| ------------------------------------ | ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui    | `string`                         | Identifiant canonique du Plugin. C’est l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                                        |
| `configSchema`                       | Oui    | `object`                         | JSON Schema intégré pour la configuration de ce Plugin.                                                                                                                                                                           |
| `enabledByDefault`                   | Non    | `true`                           | Marque un Plugin intégré comme activé par défaut. Omettez-le, ou définissez toute valeur différente de `true`, pour laisser le Plugin désactivé par défaut.                                                                     |
| `legacyPluginIds`                    | Non    | `string[]`                       | Identifiants hérités qui se normalisent vers l’identifiant canonique de ce Plugin.                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Non    | `string[]`                       | Identifiants de fournisseurs qui doivent activer automatiquement ce Plugin lorsque l’authentification, la configuration ou les références de modèles les mentionnent.                                                             |
| `kind`                               | Non    | `"memory"` \| `"context-engine"` | Déclare un type de Plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Non    | `string[]`                       | Identifiants de canaux détenus par ce Plugin. Utilisés pour la découverte et la validation de configuration.                                                                                                                     |
| `providers`                          | Non    | `string[]`                       | Identifiants de fournisseurs détenus par ce Plugin.                                                                                                                                                                               |
| `providerDiscoveryEntry`             | Non    | `string`                         | Chemin léger vers un module de découverte de fournisseur, relatif à la racine du Plugin, pour des métadonnées de catalogue de fournisseurs à portée du manifeste qui peuvent être chargées sans activer tout le runtime du Plugin. |
| `modelSupport`                       | Non    | `object`                         | Métadonnées abrégées de familles de modèles détenues par le manifeste, utilisées pour charger automatiquement le Plugin avant le runtime.                                                                                        |
| `modelCatalog`                       | Non    | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs détenus par ce Plugin. C’est le contrat du plan de contrôle pour les futures opérations de listing en lecture seule, onboarding, sélecteurs de modèles, alias et suppression sans charger le runtime du Plugin. |
| `providerEndpoints`                  | Non    | `object[]`                       | Métadonnées de manifeste sur les hôtes/baseUrl d’endpoint pour les routes de fournisseurs que le cœur doit classifier avant le chargement du runtime du fournisseur.                                                             |
| `cliBackends`                        | Non    | `string[]`                       | Identifiants de backends CLI d’inférence détenus par ce Plugin. Utilisés pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                                 |
| `syntheticAuthRefs`                  | Non    | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique détenu par le Plugin doit être sondé pendant la découverte à froid des modèles avant le chargement du runtime.                           |
| `nonSecretAuthMarkers`               | Non    | `string[]`                       | Valeurs d’espace réservé de clés API détenues par des Plugins intégrés qui représentent un état d’identifiants locaux, OAuth ou ambiants non secret.                                                                             |
| `commandAliases`                     | Non    | `object[]`                       | Noms de commandes détenus par ce Plugin qui doivent produire des diagnostics de configuration et CLI conscients du Plugin avant le chargement du runtime.                                                                         |
| `providerAuthEnvVars`                | Non    | `Record<string, string[]>`       | Métadonnées de compatibilité dépréciées sur les variables d’environnement pour la recherche d’authentification/statut des fournisseurs. Préférez `setup.providers[].envVars` pour les nouveaux Plugins ; OpenClaw continue de lire ceci pendant la fenêtre de dépréciation. |
| `providerAuthAliases`                | Non    | `Record<string, string>`         | Identifiants de fournisseurs qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de code qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                     | Non    | `Record<string, string[]>`       | Métadonnées légères de variables d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez cela pour la configuration de canal pilotée par l’environnement ou pour les surfaces d’authentification que les helpers génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non    | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution de fournisseur préféré et le câblage simple des flags CLI.                                                                       |
| `activation`                         | Non    | `object`                         | Métadonnées légères du planificateur d’activation pour le chargement déclenché par fournisseur, commande, canal, route et capacité. Métadonnées uniquement ; le runtime du Plugin reste propriétaire du comportement réel.     |
| `setup`                              | Non    | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du Plugin.                                                                           |
| `qaRunners`                          | Non    | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du Plugin.                                                                                                          |
| `contracts`                          | Non    | `object`                         | Instantané statique des capacités intégrées pour les hooks d’authentification externes, la parole, la transcription temps réel, la voix temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non    | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les identifiants de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                               |
| `channelConfigs`                     | Non    | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                     |
| `skills`                             | Non    | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                                                  |
| `name`                               | Non    | `string`                         | Nom de Plugin lisible par un humain.                                                                                                                                                                                               |
| `description`                        | Non    | `string`                         | Résumé court affiché dans les surfaces du Plugin.                                                                                                                                                                                  |
| `version`                            | Non    | `string`                         | Version informative du Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Non    | `Record<string, object>`         | Libellés d’UI, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                                                        |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit cela avant le chargement du runtime du fournisseur.
Les listes de configuration des fournisseurs utilisent ces choix issus du manifeste, les choix de configuration dérivés des descripteurs
et les métadonnées du catalogue d’installation sans charger le runtime du fournisseur.

| Champ                 | Requis | Type                                            | Signification                                                                                           |
| --------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui    | `string`                                        | Identifiant du fournisseur auquel appartient ce choix.                                                  |
| `method`              | Oui    | `string`                                        | Identifiant de méthode d’authentification vers lequel répartir.                                         |
| `choiceId`            | Oui    | `string`                                        | Identifiant stable de choix d’authentification utilisé par les flux d’onboarding et CLI.               |
| `choiceLabel`         | Non    | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw revient à `choiceId`.                       |
| `choiceHint`          | Non    | `string`                                        | Texte d’aide court pour le sélecteur.                                                                   |
| `assistantPriority`   | Non    | `number`                                        | Les valeurs plus basses sont triées plus tôt dans les sélecteurs interactifs pilotés par assistant.    |
| `assistantVisibility` | Non    | `"visible"` \| `"manual-only"`                  | Masque le choix des sélecteurs de l’assistant tout en autorisant sa sélection manuelle en CLI.         |
| `deprecatedChoiceIds` | Non    | `string[]`                                      | Identifiants hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.    |
| `groupId`             | Non    | `string`                                        | Identifiant facultatif de groupe pour regrouper des choix liés.                                         |
| `groupLabel`          | Non    | `string`                                        | Libellé visible par l’utilisateur pour ce groupe.                                                       |
| `groupHint`           | Non    | `string`                                        | Texte d’aide court pour le groupe.                                                                      |
| `optionKey`           | Non    | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul flag.                           |
| `cliFlag`             | Non    | `string`                                        | Nom du flag CLI, par exemple `--openrouter-api-key`.                                                    |
| `cliOption`           | Non    | `string`                                        | Forme complète de l’option CLI, par exemple `--openrouter-api-key <key>`.                               |
| `cliDescription`      | Non    | `string`                                        | Description utilisée dans l’aide CLI.                                                                   |
| `onboardingScopes`    | Non    | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un Plugin possède un nom de commande d’exécution que les utilisateurs peuvent
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

| Champ        | Requis | Type              | Signification                                                          |
| ------------ | ------ | ----------------- | ---------------------------------------------------------------------- |
| `name`       | Oui    | `string`          | Nom de commande appartenant à ce Plugin.                               |
| `kind`       | Non    | `"runtime-slash"` | Marque l’alias comme commande slash de chat plutôt que comme commande CLI racine. |
| `cliCommand` | Non    | `string`          | Commande CLI racine liée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/chargement.

Ce bloc contient des métadonnées de planification, pas une API de cycle de vie. Il n’enregistre pas
de comportement runtime, ne remplace pas `register(...)` et ne garantit pas que
le code du Plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
restreindre les Plugins candidats avant de revenir aux métadonnées existantes de propriété du manifeste
telles que `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et hooks.

Préférez les métadonnées les plus étroites qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour des indications supplémentaires du planificateur
qui ne peuvent pas être représentées par ces champs de propriété.
Utilisez le champ de niveau supérieur `cliBackends` pour les alias de runtime CLI tels que `claude-cli`,
`codex-cli` ou `google-gemini-cli` ; `activation.onAgentHarnesses` est réservé
aux identifiants de harness d’agent embarqués qui n’ont pas déjà de champ de propriété.

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement runtime et il ne
remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée runtime/Plugin.
Les consommateurs actuels l’utilisent comme indice de restriction avant un chargement plus large du Plugin, donc
l’absence de métadonnées d’activation ne coûte généralement que des performances ; elle ne devrait pas
modifier le comportement tant que les replis de propriété du manifeste hérités existent encore.

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

| Champ              | Requis | Type                                                 | Signification                                                                                                                                    |
| ------------------ | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onProviders`      | Non    | `string[]`                                           | Identifiants de fournisseurs qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                              |
| `onAgentHarnesses` | Non    | `string[]`                                           | Identifiants de runtime de harness d’agent embarqué qui doivent inclure ce Plugin dans les plans d’activation/chargement. Utilisez `cliBackends` au niveau supérieur pour les alias de backend CLI. |
| `onCommands`       | Non    | `string[]`                                           | Identifiants de commandes qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                 |
| `onChannels`       | Non    | `string[]`                                           | Identifiants de canaux qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                    |
| `onRoutes`         | Non    | `string[]`                                           | Types de routes qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                           |
| `onCapabilities`   | Non    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacité utilisées par la planification d’activation du plan de contrôle. Préférez des champs plus étroits lorsque c’est possible. |

Consommateurs live actuels :

- la planification CLI déclenchée par commande revient aux champs hérités
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de démarrage de runtime d’agent utilise `activation.onAgentHarnesses` pour les
  harnesses embarqués et `cliBackends[]` au niveau supérieur pour les alias de runtime CLI
- la planification configuration/canal déclenchée par canal revient à la propriété héritée `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification configuration/runtime déclenchée par fournisseur revient aux champs hérités
  `providers[]` et `cliBackends[]` au niveau supérieur lorsque les métadonnées explicites
  d’activation de fournisseur sont absentes

Les diagnostics du planificateur peuvent distinguer les indices d’activation explicites du repli
de propriété du manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` a correspondu, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases`. Ces libellés de raison sont destinés aux
diagnostics et tests de l’hôte ; les auteurs de Plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un Plugin apporte un ou plusieurs exécuteurs de transport sous la racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; le runtime du Plugin
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

| Champ         | Requis | Type     | Signification                                                    |
| ------------- | ------ | -------- | ---------------------------------------------------------------- |
| `commandName` | Oui    | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.   |
| `description` | Non    | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande stub. |

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées légères détenues par le Plugin
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

Le champ de niveau supérieur `cliBackends` reste valide et continue de décrire les
backends CLI d’inférence. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour
les flux plan de contrôle/configuration qui doivent rester purement metadata-only.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` constituent la surface privilégiée
de recherche descriptor-first pour la découverte de configuration. Si le descripteur ne fait que
restreindre le Plugin candidat et que la configuration a encore besoin de hooks runtime plus riches au moment du setup, définissez `requiresRuntime: true` et gardez `setup-api` en place comme chemin
d’exécution de repli.

OpenClaw inclut aussi `setup.providers[].envVars` dans les recherches génériques d’authentification fournisseur et de variables d’environnement. `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité pendant la fenêtre de dépréciation, mais les Plugins non intégrés qui l’utilisent encore
reçoivent un diagnostic de manifeste. Les nouveaux Plugins doivent placer les métadonnées env
de configuration/statut sur `setup.providers[].envVars`.

OpenClaw peut également dériver des choix simples de configuration à partir de `setup.providers[].authMethods`
lorsqu’aucune entrée de setup n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que le runtime de configuration n’est pas nécessaire. Les entrées explicites `providerAuthChoices` restent préférées pour les libellés personnalisés, les flags CLI, la portée d’onboarding et les métadonnées d’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs sont suffisants pour la
surface de configuration. OpenClaw traite un `false` explicite comme un contrat descriptor-only
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche de configuration. Si
un Plugin descriptor-only fournit quand même l’une de ces entrées runtime de configuration,
OpenClaw signale un diagnostic additionnel et continue de l’ignorer. L’absence de
`requiresRuntime` conserve le comportement de repli hérité afin que les Plugins existants qui ont ajouté
des descripteurs sans ce drapeau ne cassent pas.

Comme la recherche de configuration peut exécuter du code `setup-api` détenu par le Plugin, les
valeurs normalisées de `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques
à travers les Plugins découverts. Une propriété ambiguë échoue en fermeture prudente au lieu de choisir un
gagnant selon l’ordre de découverte.

Lorsque le runtime de configuration s’exécute, les diagnostics du registre de configuration signalent une dérive de descripteur si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs du manifeste ne déclarent pas, ou si un descripteur n’a pas d’enregistrement runtime correspondant. Ces diagnostics sont additionnels et ne rejettent pas les Plugins hérités.

### Référence `setup.providers`

| Champ         | Requis | Type       | Signification                                                                              |
| ------------- | ------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Oui    | `string`   | Identifiant du fournisseur exposé pendant la configuration ou l’onboarding. Gardez les identifiants normalisés globalement uniques. |
| `authMethods` | Non    | `string[]` | Identifiants de méthodes de configuration/authentification pris en charge par ce fournisseur sans charger le runtime complet. |
| `envVars`     | Non    | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement du runtime du Plugin. |

### Champs `setup`

| Champ              | Requis | Type       | Signification                                                                                     |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Non    | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration et l’onboarding.    |
| `cliBackends`      | Non    | `string[]` | Identifiants de backend au moment de la configuration utilisés pour la recherche descriptor-first. Gardez les identifiants normalisés globalement uniques. |
| `configMigrations` | Non    | `string[]` | Identifiants de migration de configuration détenus par la surface de configuration de ce Plugin. |
| `requiresRuntime`  | Non    | `boolean`  | Indique si la configuration nécessite encore l’exécution de `setup-api` après la recherche par descripteur. |

## Référence `uiHints`

`uiHints` est une correspondance des noms de champs de configuration vers de petites indications de rendu.

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

| Champ         | Type       | Signification                             |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Libellé de champ visible par l’utilisateur. |
| `help`        | `string`   | Texte d’aide court.                       |
| `tags`        | `string[]` | Tags d’UI facultatifs.                    |
| `advanced`    | `boolean`  | Marque le champ comme avancé.             |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu’OpenClaw peut
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

| Champ                            | Type       | Signification                                                        |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identifiants de factory d’extension Codex app-server, actuellement `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Identifiants de runtime pour lesquels un Plugin intégré peut enregistrer un middleware de résultat d’outil. |
| `externalAuthProviders`          | `string[]` | Identifiants de fournisseurs dont ce Plugin possède le hook de profil d’authentification externe. |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de parole détenus par ce Plugin.        |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription temps réel détenus par ce Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de voix temps réel détenus par ce Plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants de fournisseurs d’embeddings mémoire détenus par ce Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension des médias détenus par ce Plugin. |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d’images détenus par ce Plugin. |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération vidéo détenus par ce Plugin. |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération web détenus par ce Plugin. |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche web détenus par ce Plugin. |
| `tools`                          | `string[]` | Noms d’outils d’agent détenus par ce Plugin pour les vérifications de contrat intégrées. |

`contracts.embeddedExtensionFactories` est conservé pour les factory d’extension
intégrées réservées à Codex app-server. Les transformations intégrées de résultats d’outils doivent
déclarer `contracts.agentToolResultMiddleware` et s’enregistrer avec
`api.registerAgentToolResultMiddleware(...)` à la place. Les Plugins externes ne peuvent pas
enregistrer de middleware de résultat d’outil, car cette jonction peut réécrire des sorties d’outil à haute confiance avant que le modèle ne les voie.

Les Plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les Plugins sans cette déclaration fonctionnent encore
via un repli de compatibilité déprécié, mais ce repli est plus lent et sera supprimé après la
fenêtre de migration.

Les fournisseurs intégrés d’embeddings mémoire doivent déclarer
`contracts.memoryEmbeddingProviders` pour chaque identifiant d’adaptateur qu’ils exposent, y compris
les adaptateurs intégrés comme `local`. Les chemins CLI autonomes utilisent ce contrat de manifeste
pour ne charger que le Plugin propriétaire avant que le runtime complet de la Gateway n’ait
enregistré les fournisseurs.

## Référence `mediaUnderstandingProviderMetadata`

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias possède
des modèles par défaut, une priorité de repli d’authentification automatique ou une prise en charge native des documents dont les helpers génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
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

| Champ                  | Type                                | Signification                                                              |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                               |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité → modèle utilisées lorsque la configuration ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus faibles sont triés plus tôt pour le repli automatique du fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de document natives prises en charge par le fournisseur.           |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu’un Plugin de canal a besoin de métadonnées de configuration légères avant
le chargement du runtime. La découverte en lecture seule de configuration/statut du canal peut utiliser directement ces métadonnées pour les canaux externes configurés lorsqu’aucune entrée de configuration n’est disponible, ou
lorsque `setup.requiresRuntime: false` déclare que le runtime de configuration n’est pas nécessaire.

`channelConfigs` est une métadonnée de manifeste de Plugin, pas une nouvelle section de configuration utilisateur
de niveau supérieur. Les utilisateurs continuent de configurer les instances de canal sous `channels.<channel-id>`.
OpenClaw lit les métadonnées du manifeste pour décider quel Plugin possède ce canal configuré
avant l’exécution du code runtime du Plugin.

Pour un Plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les Plugins non intégrés qui déclarent `channels[]` doivent également déclarer des entrées
`channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le Plugin, mais
le schéma de configuration à froid, la configuration et les surfaces de Control UI ne peuvent pas connaître
la forme des options détenues par le canal tant que le runtime du Plugin n’est pas exécuté.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et
`nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut statiques `auto` pour les vérifications de configuration de commandes qui s’exécutent avant le chargement du runtime du canal. Les canaux intégrés peuvent aussi publier
les mêmes valeurs par défaut via `package.json#openclaw.channel.commands` aux côtés de leurs autres métadonnées de catalogue de canal détenues par le package.

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
| `schema`      | `object`                 | JSON Schema pour `channels.<id>`. Requis pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés d’UI/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Description courte du canal pour les surfaces d’inspection et de catalogue.              |
| `commands`    | `object`                 | Valeurs par défaut statiques des commandes natives et des Skills natives pour les vérifications de configuration pré-runtime. |
| `preferOver`  | `string[]`               | Identifiants de Plugins hérités ou de priorité plus basse que ce canal doit surpasser dans les surfaces de sélection.

### Remplacer un autre Plugin de canal

Utilisez `preferOver` lorsque votre Plugin est le propriétaire préféré pour un identifiant de canal qu’un
autre Plugin peut également fournir. Les cas courants sont un identifiant de Plugin renommé, un
Plugin autonome qui remplace un Plugin intégré, ou un fork maintenu qui
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
l’identifiant du Plugin préféré. Si le Plugin de priorité inférieure n’a été sélectionné que parce
qu’il est intégré ou activé par défaut, OpenClaw le désactive dans la configuration d’exécution effective afin qu’un seul Plugin possède le canal et ses outils. La sélection explicite de l’utilisateur l’emporte toujours : si l’utilisateur active explicitement les deux Plugins, OpenClaw préserve ce choix et signale des diagnostics de doublon canal/outil au lieu de modifier silencieusement l’ensemble de Plugins demandé.

Gardez `preferOver` limité aux identifiants de Plugins qui peuvent réellement fournir le même canal.
Ce n’est pas un champ général de priorité et il ne renomme pas les clés de configuration utilisateur.

## Référence `modelSupport`

Utilisez `modelSupport` lorsque OpenClaw doit déduire votre Plugin fournisseur à partir
d’identifiants abrégés de modèles comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement
du runtime du Plugin.

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
- si un Plugin non intégré et un Plugin intégré correspondent tous deux, le Plugin non intégré
  l’emporte
- toute ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                               |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` sur les identifiants abrégés de modèles. |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants abrégés de modèles après suppression du suffixe de profil. |

## Référence `modelCatalog`

Utilisez `modelCatalog` lorsque OpenClaw doit connaître les métadonnées de modèles d’un fournisseur avant
de charger le runtime du Plugin. C’est la source détenue par le manifeste pour les lignes fixes
du catalogue, les alias de fournisseurs, les règles de suppression et le mode de découverte. Le rafraîchissement
runtime appartient toujours au code runtime du fournisseur, mais le manifeste indique au cœur quand le runtime
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

Champs de niveau supérieur :

| Champ          | Type                                                     | Signification                                                                                             |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Lignes de catalogue pour les identifiants de fournisseurs détenus par ce Plugin. Les clés doivent aussi apparaître dans `providers` au niveau supérieur. |
| `aliases`      | `Record<string, object>`                                 | Alias de fournisseurs qui doivent se résoudre vers un fournisseur détenu pour la planification du catalogue ou des suppressions. |
| `suppressions` | `object[]`                                               | Lignes de modèles issues d’une autre source que ce Plugin supprime pour une raison spécifique au fournisseur. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées du manifeste, rafraîchi dans le cache, ou s’il nécessite le runtime. |

Champs de fournisseur :

| Champ     | Type                     | Signification                                                  |
| --------- | ------------------------ | -------------------------------------------------------------- |
| `baseUrl` | `string`                 | URL de base facultative par défaut pour les modèles de ce catalogue fournisseur. |
| `api`     | `ModelApi`               | Adaptateur API facultatif par défaut pour les modèles de ce catalogue fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques facultatifs qui s’appliquent à ce catalogue fournisseur. |
| `models`  | `object[]`               | Lignes de modèles requises. Les lignes sans `id` sont ignorées. |

Champs de modèle :

| Champ           | Type                                                           | Signification                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Identifiant local au fournisseur, sans le préfixe `provider/`.             |
| `name`          | `string`                                                       | Nom d’affichage facultatif.                                                |
| `api`           | `ModelApi`                                                     | Remplacement facultatif d’API par modèle.                                  |
| `baseUrl`       | `string`                                                       | Remplacement facultatif de base URL par modèle.                            |
| `headers`       | `Record<string, string>`                                       | En-têtes statiques facultatifs par modèle.                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalités acceptées par le modèle.                                         |
| `reasoning`     | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.               |
| `contextWindow` | `number`                                                       | Fenêtre de contexte native du fournisseur.                                 |
| `contextTokens` | `number`                                                       | Plafond facultatif effectif de contexte runtime lorsqu’il diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de jetons de sortie lorsqu’il est connu.                    |
| `cost`          | `object`                                                       | Tarification facultative en USD par million de jetons, y compris `tieredPricing` facultatif. |
| `compat`        | `object`                                                       | Drapeaux facultatifs de compatibilité correspondant à la compatibilité de configuration des modèles OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Statut de listing. Ne supprimez que lorsque la ligne ne doit pas apparaître du tout. |
| `statusReason`  | `string`                                                       | Raison facultative affichée avec un statut non disponible.                 |
| `replaces`      | `string[]`                                                     | Anciens identifiants locaux au fournisseur remplacés par ce modèle.        |
| `replacedBy`    | `string`                                                       | Identifiant local au fournisseur du modèle de remplacement pour les lignes dépréciées. |
| `tags`          | `string[]`                                                     | Tags stables utilisés par les sélecteurs et les filtres.                   |

Ne mettez pas de données uniquement runtime dans `modelCatalog`. Si un fournisseur a besoin d’un état de compte,
d’une requête API ou de la découverte d’un processus local pour connaître l’ensemble complet des modèles,
déclarez ce fournisseur comme `refreshable` ou `runtime` dans `discovery`.

### OpenClaw Provider Index

L’OpenClaw Provider Index est une métadonnée de prévisualisation détenue par OpenClaw pour les fournisseurs
dont les Plugins ne sont peut-être pas encore installés. Il ne fait pas partie d’un manifeste de Plugin.
Les manifestes de Plugin restent l’autorité pour les Plugins installés. Le Provider Index est le contrat
interne de repli que consommeront les futures surfaces de fournisseur installable et de sélecteur de modèles avant installation lorsqu’un Plugin fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. `modelCatalog` du manifeste du Plugin installé.
3. Cache du catalogue de modèles issu d’un rafraîchissement explicite.
4. Lignes de prévisualisation de l’OpenClaw Provider Index.

Le Provider Index ne doit pas contenir de secrets, d’état activé, de hooks runtime ni de données de modèles live spécifiques à un compte. Ses catalogues de prévisualisation utilisent la même
forme de ligne de fournisseur `modelCatalog` que les manifestes de Plugin, mais doivent rester limités
à des métadonnées d’affichage stables, sauf si des champs d’adaptateur runtime tels que `api`,
`baseUrl`, tarification ou drapeaux de compatibilité sont volontairement maintenus alignés avec le manifeste du Plugin installé. Les fournisseurs dotés d’une découverte live `/models` doivent écrire
les lignes rafraîchies via le chemin explicite du cache de catalogue de modèles au lieu de faire
appel aux API fournisseur lors du listing normal ou de l’onboarding.

Les entrées du Provider Index peuvent aussi contenir des métadonnées de Plugin installable pour des fournisseurs
dont le Plugin a été déplacé hors du cœur ou n’est autrement pas encore installé. Ces
métadonnées reflètent le modèle du catalogue de canaux : nom du package, spécification d’installation npm,
intégrité attendue et libellés légers de choix d’authentification suffisent pour afficher une
option de configuration installable. Une fois le Plugin installé, son manifeste l’emporte et
l’entrée du Provider Index est ignorée pour ce fournisseur.

Les clés de capacité héritées au niveau supérieur sont dépréciées. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal du manifeste ne traite plus ces champs de niveau supérieur comme propriété de capacité.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| Fichier                | À utiliser pour                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’UI qui doivent exister avant l’exécution du code du Plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le filtrage d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du Plugin, mettez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d’entrée ou le comportement d’installation npm, mettez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de Plugin pré-runtime vivent intentionnellement dans `package.json` sous le bloc
`openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée natifs du Plugin. Doit rester à l’intérieur du répertoire du package du Plugin.                                                                        |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript buildés pour les packages installés. Doit rester à l’intérieur du répertoire du package du Plugin.                                 |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration utilisé pendant l’onboarding, le démarrage différé du canal et la découverte en lecture seule du statut de canal/SecretRef. Doit rester à l’intérieur du répertoire du package du Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration JavaScript buildé pour les packages installés. Doit rester à l’intérieur du répertoire du package du Plugin.                            |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canaux comme les libellés, chemins de documentation, alias et texte de sélection.                                                              |
| `openclaw.channel.commands`                                       | Métadonnées statiques de valeurs par défaut automatiques pour commandes natives et Skills natives utilisées par les surfaces de configuration, d’audit et de liste de commandes avant le chargement du runtime du canal. |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérificateur d’état configuré pouvant répondre à « une configuration env-only existe-t-elle déjà ? » sans charger tout le runtime du canal.                 |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérificateur d’authentification persistée pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger tout le runtime du canal.                 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les Plugins intégrés et publiés en externe.                                                                                             |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                             |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, utilisant un plancher semver comme `>=2026.3.22`.                                                                             |
| `openclaw.install.expectedIntegrity`                              | Chaîne d’intégrité dist npm attendue telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à cette valeur.                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation de Plugin intégré lorsque la configuration est invalide.                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le Plugin de canal complet au démarrage.                                                              |

Les métadonnées du manifeste décident quels choix de fournisseur/canal/configuration apparaissent dans
l’onboarding avant le chargement du runtime. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce Plugin lorsque l’utilisateur choisit l’un de ces
choix. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du
registre des manifestes. Les valeurs invalides sont rejetées ; les valeurs valides mais plus récentes
ignorent le Plugin sur les hôtes plus anciens.

L’épinglage exact de version npm vit déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles du catalogue externe
doivent associer des specs exactes à `expectedIntegrity` afin que les flux de mise à jour échouent en fermeture prudente si l’artefact npm récupéré ne correspond plus à la release épinglée.
L’onboarding interactif continue de proposer des specs npm de registre de confiance, y compris les noms
de package simples et les dist-tags, pour compatibilité. Les diagnostics du catalogue peuvent
distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec inadéquation de nom de package et avec choix par défaut invalide. Ils avertissent aussi lorsque
`expectedIntegrity` est présent mais qu’il n’existe aucune source npm valide à épingler.
Lorsque `expectedIntegrity` est présent,
les flux d’installation/mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est
enregistrée sans épingle d’intégrité.

Les Plugins de canal doivent fournir `openclaw.setupEntry` lorsque le statut, la liste des canaux
ou les scans SecretRef doivent identifier des comptes configurés sans charger le runtime complet.
L’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs sûrs pour la configuration,
le statut et les secrets ; gardez les clients réseau, les écouteurs gateway et les runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les contrôles de frontière de package pour les
champs de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre
chargeable un chemin `openclaw.extensions` qui s’échappe du package.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il ne
rend pas installables des configurations arbitrairement cassées. Aujourd’hui, il permet uniquement aux flux d’installation de récupérer certains échecs obsolètes de mise à niveau de Plugin intégré, tels qu’un chemin de Plugin intégré manquant ou une entrée obsolète `channels.<id>` pour ce même Plugin intégré. Les erreurs de configuration sans rapport bloquent toujours l’installation et orientent les opérateurs vers
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un petit module de vérification :

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

Utilisez-le lorsque la configuration, doctor ou les flux d’état configuré ont besoin d’une
sonde d’authentification yes/no légère avant le chargement complet du Plugin de canal. L’export ciblé
doit être une petite fonction qui lit uniquement l’état persistant ; ne le faites pas passer par le large barrel runtime complet du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères d’état configuré env-only :

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

Utilisez-le lorsqu’un canal peut répondre à l’état configuré à partir de l’environnement ou d’autres
entrées minuscules non runtime. Si la vérification nécessite la résolution complète de la configuration ou le vrai
runtime du canal, gardez cette logique dans le hook du Plugin `config.hasConfiguredState` à la place.

## Priorité de découverte (identifiants de Plugin dupliqués)

OpenClaw découvre les Plugins depuis plusieurs racines (intégrés, installation globale, espace de travail, chemins explicitement sélectionnés par configuration). Si deux découvertes partagent le même `id`, seul le manifeste de **plus haute priorité** est conservé ; les doublons de priorité inférieure sont supprimés au lieu d’être chargés à côté.

Priorité, de la plus haute à la plus basse :

1. **Sélectionné par configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Intégré** — Plugins livrés avec OpenClaw
3. **Installation globale** — Plugins installés dans la racine globale des Plugins OpenClaw
4. **Espace de travail** — Plugins découverts relativement à l’espace de travail courant

Conséquences :

- Une copie forkée ou obsolète d’un Plugin intégré présente dans l’espace de travail ne masquera pas la build intégrée.
- Pour réellement remplacer un Plugin intégré par un Plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il l’emporte par priorité au lieu de compter sur la découverte dans l’espace de travail.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences JSON Schema

- **Chaque Plugin doit fournir un JSON Schema**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas au runtime.

## Comportement de validation

- Les clés inconnues `channels.*` sont des **erreurs**, sauf si l’identifiant de canal est déclaré par
  un manifeste de Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des identifiants de Plugin **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor + les journaux.

Voir la [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les Plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local. Le runtime charge toujours séparément le module du Plugin ; le manifeste ne sert qu’à la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez les clés personnalisées de niveau supérieur.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un Plugin n’en a pas besoin.
- `providerDiscoveryEntry` doit rester léger et ne doit pas importer de large code runtime ; utilisez-le pour des métadonnées statiques de catalogue de fournisseurs ou des descripteurs étroits de découverte, pas pour une exécution au moment de la requête.
- Les types de Plugins exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (par défaut `legacy`).
- Les métadonnées de variables d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` déprécié et `channelEnvVars`) sont uniquement déclaratives. Le statut, l’audit, la validation de livraison Cron et les autres surfaces en lecture seule appliquent toujours la confiance du Plugin et la politique d’activation effective avant de traiter une variable d’environnement comme configurée.
- Pour les métadonnées d’assistant runtime qui nécessitent du code fournisseur, voir [Provider runtime hooks](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre Plugin dépend de modules natifs, documentez les étapes de build et toute exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Associé

<CardGroup cols={3}>
  <Card title="Building plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Premiers pas avec les Plugins.
  </Card>
  <Card title="Architecture des Plugins" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="Vue d’ensemble du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK de Plugin et imports par sous-chemin.
  </Card>
</CardGroup>
