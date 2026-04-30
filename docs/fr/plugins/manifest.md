---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration de Plugin ou déboguer des erreurs de validation de Plugin
summary: Exigences du manifeste de Plugin + schéma JSON (validation stricte de la configuration)
title: Manifeste de Plugin
x-i18n:
    generated_at: "2026-04-30T07:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

Cette page concerne uniquement le **manifeste de Plugin OpenClaw natif**.

Pour les dispositions de bundles compatibles, consultez [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des
  composants Claude sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json`
du bundle Claude, les valeurs par défaut LSP du bundle Claude et les packs de hooks pris en charge
lorsque la disposition correspond aux attentes du runtime OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du Plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du Plugin**. Les manifestes manquants ou invalides sont traités comme des
erreurs de Plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de Plugin : [Plugins](/fr/tools/plugin).
Pour le modèle de capacité natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacité](/fr/plugins/architecture#public-capability-model).

## Ce que fait ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit **avant de charger le code de votre
Plugin**. Tout ce qui suit doit être suffisamment léger pour être inspecté sans démarrer le runtime du
Plugin.

**Utilisez-le pour :**

- l’identité du Plugin, la validation de configuration et les indications pour l’interface de configuration
- les métadonnées d’authentification, d’onboarding et de configuration initiale (alias, activation automatique, variables d’environnement de provider, choix d’authentification)
- les indications d’activation pour les surfaces de plan de contrôle
- la propriété abrégée des familles de modèles
- les instantanés statiques de propriété des capacités (`contracts`)
- les métadonnées du runner QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration propres aux canaux fusionnées dans les surfaces de catalogue et de validation

**Ne l’utilisez pas pour :** enregistrer le comportement runtime, déclarer des points d’entrée de code
ou des métadonnées d’installation npm. Ceux-ci appartiennent au code de votre Plugin et à `package.json`.

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

| Champ                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | Identifiant de Plugin canonique. Il s’agit de l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                                                   |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON intégré pour la configuration de ce Plugin.                                                                                                                                                                                            |
| `enabledByDefault`                   | Non         | `true`                           | Marque un Plugin groupé comme activé par défaut. Omettez-le, ou définissez n’importe quelle valeur autre que `true`, pour laisser le Plugin désactivé par défaut.                                                                                 |
| `legacyPluginIds`                    | Non         | `string[]`                       | Anciens identifiants qui se normalisent vers cet identifiant de Plugin canonique.                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | Identifiants de fournisseurs qui doivent activer automatiquement ce Plugin lorsque l’authentification, la configuration ou les références de modèles les mentionnent.                                                                              |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de Plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                                  |
| `channels`                           | Non         | `string[]`                       | Identifiants de canaux appartenant à ce Plugin. Utilisé pour la découverte et la validation de configuration.                                                                                                                                      |
| `providers`                          | Non         | `string[]`                       | Identifiants de fournisseurs appartenant à ce Plugin.                                                                                                                                                                                              |
| `providerDiscoveryEntry`             | Non         | `string`                         | Chemin de module léger de découverte de fournisseurs, relatif à la racine du Plugin, pour les métadonnées de catalogue de fournisseurs limitées au manifeste qui peuvent être chargées sans activer tout le runtime du Plugin.                    |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées de familles de modèles, détenues par le manifeste, utilisées pour charger automatiquement le Plugin avant le runtime.                                                                                                         |
| `modelCatalog`                       | Non         | `object`                         | Métadonnées déclaratives de catalogue de modèles pour les fournisseurs appartenant à ce Plugin. C’est le contrat du plan de contrôle pour les futures listes en lecture seule, l’onboarding, les sélecteurs de modèles, les alias et la suppression sans charger le runtime du Plugin. |
| `modelPricing`                       | Non         | `object`                         | Politique de recherche de tarification externe détenue par le fournisseur. Utilisez-la pour exclure les fournisseurs locaux/auto-hébergés des catalogues de tarification distants ou mapper les références de fournisseurs aux identifiants de catalogue OpenRouter/LiteLLM sans coder en dur les identifiants de fournisseurs dans le cœur. |
| `modelIdNormalization`               | Non         | `object`                         | Nettoyage des alias/préfixes d’identifiants de modèles détenu par le fournisseur qui doit s’exécuter avant le chargement du runtime du fournisseur.                                                                                                |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl de point de terminaison, détenues par le manifeste, pour les routes de fournisseurs que le cœur doit classifier avant le chargement du runtime du fournisseur.                                                          |
| `providerRequest`                    | Non         | `object`                         | Métadonnées légères de famille de fournisseurs et de compatibilité de requêtes utilisées par la politique de requêtes générique avant le chargement du runtime du fournisseur.                                                                    |
| `cliBackends`                        | Non         | `string[]`                       | Identifiants de backends d’inférence CLI appartenant à ce Plugin. Utilisé pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                                                 |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique détenu par le Plugin doit être sondé pendant la découverte de modèles à froid avant le chargement du runtime.                                             |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs de clé API indicatrices appartenant à un Plugin groupé qui représentent un état d’identifiants non secret local, OAuth ou ambiant.                                                                                                        |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes appartenant à ce Plugin qui doivent produire des diagnostics de configuration et CLI tenant compte du Plugin avant le chargement du runtime.                                                                                     |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées d’environnement de compatibilité obsolètes pour la recherche d’authentification/statut de fournisseur. Préférez `setup.providers[].envVars` pour les nouveaux Plugins ; OpenClaw les lit encore pendant la période de dépréciation.   |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | Identifiants de fournisseurs qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de codage qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées d’environnement légères de canal qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez-les pour les surfaces de configuration ou d’authentification de canal pilotées par l’environnement que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des flags CLI.                                                                                        |
| `activation`                         | Non         | `object`                         | Métadonnées légères de planificateur d’activation pour le chargement déclenché par le démarrage, le fournisseur, la commande, le canal, la route et la capacité. Métadonnées uniquement ; le runtime du Plugin reste propriétaire du comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du Plugin.                                                                                           |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du Plugin.                                                                                                                           |
| `contracts`                          | Non         | `object`                         | Instantané statique des capacités groupées pour les hooks d’authentification externes, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de musique, la génération de vidéos, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les identifiants de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                               |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                                       |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                                                                   |
| `name`                               | Non         | `string`                         | Nom de Plugin lisible par l’humain.                                                                                                                                                                                                                |
| `description`                        | Non         | `string`                         | Court résumé affiché dans les surfaces de Plugin.                                                                                                                                                                                                  |
| `version`                            | Non         | `string`                         | Version informative du Plugin.                                                                                                                                                                                                                     |
| `uiHints`                            | Non         | `Record<string, object>`         | Libellés d’interface utilisateur, placeholders et indices de sensibilité pour les champs de configuration.                                                                                                                                          |

## Référence providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw la lit avant le chargement du runtime du fournisseur.
Les listes de configuration des fournisseurs utilisent ces choix de manifeste, les choix
de configuration dérivés des descripteurs et les métadonnées du catalogue d’installation
sans charger le runtime du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | Identifiant de fournisseur auquel ce choix appartient.                                                   |
| `method`              | Oui         | `string`                                        | Identifiant de méthode d’authentification vers lequel distribuer.                                        |
| `choiceId`            | Oui         | `string`                                        | Identifiant stable de choix d’authentification utilisé par les flux d’onboarding et de CLI.              |
| `choiceLabel`         | Non         | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw se rabat sur `choiceId`.                      |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                    |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant.   |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l’assistant tout en autorisant toujours la sélection manuelle via la CLI. |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement.      |
| `groupId`             | Non         | `string`                                        | Identifiant de groupe facultatif pour regrouper les choix liés.                                          |
| `groupLabel`          | Non         | `string`                                        | Libellé visible par l’utilisateur pour ce groupe.                                                        |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                       |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul indicateur.                      |
| `cliFlag`             | Non         | `string`                                        | Nom de l’indicateur de CLI, par exemple `--openrouter-api-key`.                                          |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option de CLI, par exemple `--openrouter-api-key <key>`.                             |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide de la CLI.                                                              |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Surfaces d’onboarding dans lesquelles ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence commandAliases

Utilisez `commandAliases` lorsqu’un Plugin possède un nom de commande d’exécution que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
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

| Champ        | Obligatoire | Type              | Signification                                                           |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce Plugin.                             |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme commande slash de chat plutôt que comme commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations de CLI, s’il en existe une. |

## Référence activation

Utilisez `activation` lorsque le Plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/chargement.

Ce bloc contient des métadonnées de planificateur, pas une API de cycle de vie. Il n’enregistre pas
de comportement d’exécution, ne remplace pas `register(...)` et ne garantit pas que
le code du Plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
restreindre les Plugins candidats avant de se rabattre sur les métadonnées de propriété de manifeste
existantes, comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez les métadonnées les plus étroites qui décrivent déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour les indices supplémentaires
du planificateur qui ne peuvent pas être représentés par ces champs de propriété.
Utilisez `cliBackends` au niveau supérieur pour les alias d’exécution CLI comme `claude-cli`,
`codex-cli` ou `google-gemini-cli` ; `activation.onAgentHarnesses` est réservé aux
identifiants de harnais d’agent intégrés qui ne disposent pas déjà d’un champ de propriété.

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement d’exécution et ne
remplace pas `register(...)`, `setupEntry` ni les autres points d’entrée d’exécution/Plugin.
Les consommateurs actuels l’utilisent comme indice de restriction avant un chargement plus large des Plugins, donc
l’absence de métadonnées d’activation ne coûte généralement que de la performance ; elle ne doit pas
modifier l’exactitude tant que les anciens replis de propriété de manifeste existent encore.

Chaque Plugin doit définir `activation.onStartup` intentionnellement à mesure qu’OpenClaw s’éloigne
des imports implicites au démarrage. Définissez-le sur `true` uniquement lorsque le Plugin doit
s’exécuter pendant le démarrage du Gateway. Définissez-le sur `false` lorsque le Plugin est inerte au
démarrage et ne doit se charger qu’à partir de déclencheurs plus étroits. Omettre `onStartup` conserve
le repli sidecar de démarrage implicite hérité obsolète pour les Plugins sans
métadonnées de capacité statiques ; les versions futures pourraient cesser de charger ces Plugins
au démarrage sauf s’ils déclarent `activation.onStartup: true`. Les rapports d’état et de
compatibilité des Plugins émettent un avertissement `legacy-implicit-startup-sidecar` lorsqu’un Plugin
dépend encore de ce repli.

Pour les tests de migration, définissez
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` afin de désactiver uniquement ce
repli obsolète. Ce mode opt-in ne bloque pas les Plugins explicites
`activation.onStartup: true` ni les Plugins chargés par un canal, une configuration,
un harnais d’agent, la mémoire ou d’autres déclencheurs d’activation plus étroits.

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

| Champ              | Obligatoire | Type                                                 | Signification                                                                                                                                                                                                                      |
| ------------------ | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | Non         | `boolean`                                            | Activation explicite au démarrage du Gateway. Chaque Plugin doit définir ce champ. `true` importe le Plugin pendant le démarrage ; `false` désactive le repli de démarrage sidecar implicite obsolète, sauf si un autre déclencheur correspondant nécessite le chargement. |
| `onProviders`      | Non         | `string[]`                                           | Identifiants de fournisseurs qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                                                                                                 |
| `onAgentHarnesses` | Non         | `string[]`                                           | Identifiants d’exécution de harnais d’agent intégrés qui doivent inclure ce Plugin dans les plans d’activation/chargement. Utilisez `cliBackends` au niveau supérieur pour les alias de backend CLI.                              |
| `onCommands`       | Non         | `string[]`                                           | Identifiants de commande qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                                                                                                     |
| `onChannels`       | Non         | `string[]`                                           | Identifiants de canal qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                                                                                                        |
| `onRoutes`         | Non         | `string[]`                                           | Types de route qui doivent inclure ce Plugin dans les plans d’activation/chargement.                                                                                                                                               |
| `onConfigPaths`    | Non         | `string[]`                                           | Chemins de configuration relatifs à la racine qui doivent inclure ce Plugin dans les plans de démarrage/chargement lorsque le chemin est présent et non explicitement désactivé.                                                   |
| `onCapabilities`   | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indices de capacité larges utilisés par la planification d’activation du plan de contrôle. Préférez les champs plus étroits lorsque c’est possible.                                                                                |

Consommateurs actifs actuels :

- La planification du démarrage du Gateway utilise `activation.onStartup` pour l’import explicite au démarrage
  et la désactivation du repli de démarrage sidecar implicite obsolète
- La planification de CLI déclenchée par commande se rabat sur l’ancien
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- La planification du démarrage de l’exécution d’agent utilise `activation.onAgentHarnesses` pour
  les harnais intégrés et `cliBackends[]` au niveau supérieur pour les alias d’exécution CLI
- La planification de configuration/canal déclenchée par canal se rabat sur l’ancienne propriété `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- La planification des Plugins au démarrage utilise `activation.onConfigPaths` pour les surfaces de configuration racine
  hors canal, comme le bloc `browser` du Plugin de navigateur inclus
- La planification de configuration/exécution déclenchée par fournisseur se rabat sur l’ancienne propriété
  `providers[]` et `cliBackends[]` au niveau supérieur lorsque les métadonnées explicites d’activation de fournisseur
  sont absentes

Les diagnostics du planificateur peuvent distinguer les indices d’activation explicites du repli de
propriété de manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` correspondait, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces libellés de raison servent aux
diagnostics de l’hôte et aux tests ; les auteurs de Plugins doivent continuer à déclarer les métadonnées
qui décrivent le mieux la propriété.

## Référence qaRunners

Utilisez `qaRunners` lorsqu’un Plugin contribue un ou plusieurs runners de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées peu coûteuses et statiques ; l’exécution du Plugin
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

| Champ         | Obligatoire | Type     | Ce que cela signifie                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Oui      | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.    |
| `description` | Non       | `string` | Texte d’aide de secours utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

## référence setup

Utilisez `setup` lorsque les surfaces de configuration et d’intégration ont besoin de métadonnées peu coûteuses appartenant au Plugin
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

Le `cliBackends` de premier niveau reste valide et continue de décrire les backends d’inférence
CLI. `setup.cliBackends` est la surface de descripteur propre à setup pour les
flux de plan de contrôle/configuration qui doivent rester limités aux métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
à privilégier, fondée d’abord sur les descripteurs, pour la découverte de setup. Si le descripteur ne fait que
restreindre le Plugin candidat et que setup a encore besoin de hooks d’exécution plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme
chemin d’exécution de secours.

OpenClaw inclut aussi `setup.providers[].envVars` dans l’authentification générique des fournisseurs et les
recherches de variables d’environnement. `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
pendant la fenêtre de dépréciation, mais les Plugins non groupés qui l’utilisent encore
reçoivent un diagnostic de manifeste. Les nouveaux Plugins doivent placer les métadonnées d’environnement de setup/statut
sur `setup.providers[].envVars`.

OpenClaw peut aussi déduire des choix simples de setup à partir de `setup.providers[].authMethods`
lorsqu’aucune entrée de setup n’est disponible, ou lorsque `setup.requiresRuntime: false`
déclare que l’exécution de setup est inutile. Les entrées explicites `providerAuthChoices` restent
préférées pour les libellés personnalisés, les indicateurs CLI, le périmètre d’intégration et les métadonnées de l’assistant.

Définissez `requiresRuntime: false` uniquement lorsque ces descripteurs suffisent pour la
surface de setup. OpenClaw traite `false` explicite comme un contrat uniquement fondé sur des descripteurs
et n’exécutera pas `setup-api` ni `openclaw.setupEntry` pour la recherche de setup. Si
un Plugin uniquement fondé sur des descripteurs expédie encore l’une de ces entrées d’exécution de setup,
OpenClaw signale un diagnostic additif et continue de l’ignorer. L’omission de
`requiresRuntime` conserve le comportement de secours historique afin que les Plugins existants qui ont ajouté
des descripteurs sans l’indicateur ne cassent pas.

Comme la recherche de setup peut exécuter du code `setup-api` appartenant au Plugin, les valeurs normalisées
`setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les
Plugins découverts. Une propriété ambiguë échoue fermement au lieu de choisir un
gagnant selon l’ordre de découverte.

Lorsque l’exécution de setup a lieu, les diagnostics du registre de setup signalent les écarts de descripteurs
si `setup-api` enregistre un fournisseur ou un backend CLI que les descripteurs
du manifeste ne déclarent pas, ou si un descripteur n’a pas d’enregistrement d’exécution
correspondant. Ces diagnostics sont additifs et ne rejettent pas les Plugins historiques.

### référence setup.providers

| Champ          | Obligatoire | Type       | Ce que cela signifie                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | Oui      | `string`   | ID de fournisseur exposé pendant setup ou l’intégration. Gardez les ID normalisés globalement uniques.             |
| `authMethods`  | Non       | `string[]` | ID de méthodes setup/auth que ce fournisseur prend en charge sans charger l’exécution complète.                       |
| `envVars`      | Non       | `string[]` | Variables d’environnement que les surfaces génériques de setup/statut peuvent vérifier avant le chargement de l’exécution du Plugin.               |
| `authEvidence` | Non       | `object[]` | Vérifications locales peu coûteuses de preuves d’authentification pour les fournisseurs qui peuvent s’authentifier via des marqueurs non secrets. |

`authEvidence` est destiné aux marqueurs d’identifiants locaux appartenant au fournisseur qui peuvent être
vérifiés sans charger le code d’exécution. Ces vérifications doivent rester peu coûteuses et locales :
aucun appel réseau, aucune lecture de trousseau ou de gestionnaire de secrets, aucune commande shell, et aucune
sonde d’API fournisseur.

Entrées de preuve prises en charge :

| Champ              | Obligatoire | Type       | Ce que cela signifie                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | Oui      | `string`   | Actuellement `local-file-with-env`.                                                                               |
| `fileEnvVar`       | Non       | `string`   | Variable d’environnement contenant un chemin explicite vers un fichier d’identifiants.                                                           |
| `fallbackPaths`    | Non       | `string[]` | Chemins de fichiers d’identifiants locaux vérifiés lorsque `fileEnvVar` est absent ou vide. Prend en charge `${HOME}` et `${APPDATA}`. |
| `requiresAnyEnv`   | Non       | `string[]` | Au moins une variable d’environnement listée doit être non vide avant que la preuve soit valide.                                    |
| `requiresAllEnv`   | Non       | `string[]` | Chaque variable d’environnement listée doit être non vide avant que la preuve soit valide.                                           |
| `credentialMarker` | Oui      | `string`   | Marqueur non secret renvoyé lorsque la preuve est présente.                                                       |
| `source`           | Non       | `string`   | Libellé de source destiné à l’utilisateur pour la sortie d’authentification/statut.                                                               |

### champs setup

| Champ              | Obligatoire | Type       | Ce que cela signifie                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non       | `object[]` | Descripteurs de setup de fournisseur exposés pendant setup et l’intégration.                                     |
| `cliBackends`      | Non       | `string[]` | ID de backend utilisés au moment de setup pour une recherche de setup fondée d’abord sur les descripteurs. Gardez les ID normalisés globalement uniques. |
| `configMigrations` | Non       | `string[]` | ID de migration de configuration appartenant à la surface setup de ce Plugin.                                          |
| `requiresRuntime`  | Non       | `boolean`  | Indique si setup a encore besoin de l’exécution de `setup-api` après la recherche par descripteur.                            |

## référence uiHints

`uiHints` est une correspondance entre les noms de champs de configuration et de petites indications de rendu.

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

| Champ         | Type       | Ce que cela signifie                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé de champ destiné à l’utilisateur.                |
| `help`        | `string`   | Court texte d’aide.                      |
| `tags`        | `string[]` | Étiquettes d’interface utilisateur facultatives.                       |
| `advanced`    | `boolean`  | Marque le champ comme avancé.            |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les entrées de formulaire.       |

## référence contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété des capacités qu’OpenClaw peut
lire sans importer l’exécution du Plugin.

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

| Champ                            | Type       | Ce que cela signifie                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID de factories d’extension du serveur d’application Codex, actuellement `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID d’exécution pour lesquels un Plugin groupé peut enregistrer un middleware de résultat d’outil. |
| `externalAuthProviders`          | `string[]` | ID de fournisseurs dont ce Plugin possède le hook de profil d’authentification externe.       |
| `speechProviders`                | `string[]` | ID de fournisseurs de parole appartenant à ce Plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | ID de fournisseurs de transcription en temps réel appartenant à ce Plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | ID de fournisseurs de voix en temps réel appartenant à ce Plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | ID de fournisseurs d’embeddings mémoire appartenant à ce Plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | ID de fournisseurs de compréhension média appartenant à ce Plugin.                    |
| `imageGenerationProviders`       | `string[]` | ID de fournisseurs de génération d’images appartenant à ce Plugin.                       |
| `videoGenerationProviders`       | `string[]` | ID de fournisseurs de génération vidéo appartenant à ce Plugin.                       |
| `webFetchProviders`              | `string[]` | ID de fournisseurs de récupération Web appartenant à ce Plugin.                              |
| `webSearchProviders`             | `string[]` | ID de fournisseurs de recherche Web appartenant à ce Plugin.                             |
| `migrationProviders`             | `string[]` | ID de fournisseurs d’importation appartenant à ce Plugin pour `openclaw migrate`.          |
| `tools`                          | `string[]` | Noms d’outils d’agent appartenant à ce Plugin pour les vérifications de contrat groupées.        |

`contracts.embeddedExtensionFactories` est conservé pour les factories d’extension
réservées au serveur d’application Codex groupées. Les transformations groupées de résultats d’outils doivent
déclarer `contracts.agentToolResultMiddleware` et s’enregistrer avec
`api.registerAgentToolResultMiddleware(...)` à la place. Les Plugins externes ne peuvent pas
enregistrer de middleware de résultat d’outil, car cette surface peut réécrire la sortie d’outil
à haute confiance avant que le modèle la voie.

Les Plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les Plugins sans cette déclaration s’exécutent encore
via un secours de compatibilité déprécié, mais ce secours est plus lent et
sera supprimé après la fenêtre de migration.

Les fournisseurs groupés d’embeddings mémoire doivent déclarer
`contracts.memoryEmbeddingProviders` pour chaque ID d’adaptateur qu’ils exposent, y compris
les adaptateurs intégrés tels que `local`. Les chemins CLI autonomes utilisent ce contrat
de manifeste pour charger uniquement le Plugin propriétaire avant que l’exécution complète du Gateway ait
enregistré les fournisseurs.

## référence mediaUnderstandingProviderMetadata

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias a
des modèles par défaut, une priorité de repli d’auto-authentification, ou une prise en charge native des documents dont
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités médias exposées par ce fournisseur.                                |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées quand la config ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus faibles sont triés plus tôt pour le repli automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de documents natives prises en charge par le fournisseur.             |

## Référence channelConfigs

Utilisez `channelConfigs` lorsqu’un Plugin de canal a besoin de métadonnées de config peu coûteuses avant
le chargement du runtime. La découverte en lecture seule de la configuration/de l’état du canal peut utiliser ces métadonnées
directement pour les canaux externes configurés lorsqu’aucune entrée de configuration n’est disponible, ou
lorsque `setup.requiresRuntime: false` déclare que le runtime de configuration est inutile.

`channelConfigs` est une métadonnée du manifeste de Plugin, pas une nouvelle section de config utilisateur de premier niveau.
Les utilisateurs configurent toujours les instances de canal sous `channels.<channel-id>`.
OpenClaw lit les métadonnées du manifeste pour décider quel Plugin possède ce canal configuré
avant l’exécution du code runtime du Plugin.

Pour un Plugin de canal, `configSchema` et `channelConfigs` décrivent des chemins différents :

- `configSchema` valide `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valide `channels.<channel-id>`

Les Plugins non groupés qui déclarent `channels[]` doivent aussi déclarer des entrées
`channelConfigs` correspondantes. Sans elles, OpenClaw peut toujours charger le Plugin, mais
le schéma de config du chemin à froid, la configuration et les surfaces de l’interface de contrôle ne peuvent pas connaître la
forme des options appartenant au canal avant l’exécution du runtime du Plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` et
`nativeSkillsAutoEnabled` peuvent déclarer des valeurs par défaut `auto` statiques pour les vérifications de config de commandes
qui s’exécutent avant le chargement du runtime du canal. Les canaux groupés peuvent aussi publier
les mêmes valeurs par défaut via `package.json#openclaw.channel.commands` avec
leurs autres métadonnées de catalogue de canal appartenant au package.

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
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Requis pour chaque entrée de config de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés/espaces réservés/indications sensibles facultatifs de l’interface pour cette section de config de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection quand les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Brève description du canal pour les surfaces d’inspection et de catalogue. |
| `commands`    | `object`                 | Valeurs par défaut automatiques statiques pour les commandes natives et les Skills natives, destinées aux vérifications de config avant runtime. |
| `preferOver`  | `string[]`               | Identifiants de Plugins anciens ou de moindre priorité que ce canal doit devancer dans les surfaces de sélection. |

### Remplacer un autre Plugin de canal

Utilisez `preferOver` lorsque votre Plugin est le propriétaire préféré d’un identifiant de canal qu’un
autre Plugin peut aussi fournir. Les cas courants sont un identifiant de Plugin renommé, un
Plugin autonome qui remplace un Plugin groupé, ou un fork maintenu qui
conserve le même identifiant de canal pour la compatibilité de la config.

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
l’identifiant de Plugin préféré. Si le Plugin de moindre priorité n’a été sélectionné que parce
qu’il est groupé ou activé par défaut, OpenClaw le désactive dans la config runtime effective
afin qu’un seul Plugin possède le canal et ses outils. La sélection explicite de l’utilisateur
prévaut toujours : si l’utilisateur active explicitement les deux Plugins, OpenClaw
préserve ce choix et signale des diagnostics de canal/outils en double au lieu de
modifier silencieusement l’ensemble de Plugins demandé.

Gardez `preferOver` limité aux identifiants de Plugins qui peuvent réellement fournir le même canal.
Ce n’est pas un champ de priorité général et il ne renomme pas les clés de config utilisateur.

## Référence modelSupport

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre Plugin de fournisseur à partir
d’identifiants de modèle abrégés comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement du runtime
du Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette précédence :

- les refs explicites `provider/model` utilisent les métadonnées de manifeste `providers` propriétaires
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un Plugin non groupé et un Plugin groupé correspondent tous les deux, le Plugin non groupé
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la config spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants de modèle abrégés. |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants de modèle abrégés après suppression du suffixe de profil. |

## Référence modelCatalog

Utilisez `modelCatalog` lorsqu’OpenClaw doit connaître les métadonnées des modèles du fournisseur avant
le chargement du runtime du Plugin. C’est la source appartenant au manifeste pour les lignes de catalogue
fixes, les alias de fournisseur, les règles de suppression et le mode de découverte. L’actualisation runtime
reste dans le code runtime du fournisseur, mais le manifeste indique au cœur quand le runtime
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
| `providers`    | `Record<string, object>`                                 | Lignes de catalogue pour les identifiants de fournisseur appartenant à ce Plugin. Les clés doivent aussi apparaître dans `providers` au premier niveau. |
| `aliases`      | `Record<string, object>`                                 | Alias de fournisseur qui doivent se résoudre vers un fournisseur possédé pour la planification de catalogue ou de suppression. |
| `suppressions` | `object[]`                                               | Lignes de modèle issues d’une autre source que ce Plugin supprime pour une raison propre au fournisseur. |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Indique si le catalogue du fournisseur peut être lu depuis les métadonnées du manifeste, actualisé dans le cache, ou nécessite le runtime. |

`aliases` participe à la recherche de propriété du fournisseur pour la planification du catalogue de modèles.
Les cibles d’alias doivent être des fournisseurs de premier niveau appartenant au même Plugin. Lorsqu’une
liste filtrée par fournisseur utilise un alias, OpenClaw peut lire le manifeste propriétaire et
appliquer les remplacements d’API/de base URL de l’alias sans charger le runtime du fournisseur.
Les alias n’étendent pas les listes de catalogue non filtrées ; les listes larges émettent uniquement les lignes
du fournisseur canonique propriétaire.

`suppressions` remplace l’ancien hook runtime de fournisseur `suppressBuiltInModel`.
Les entrées de suppression sont respectées uniquement lorsque le fournisseur appartient au Plugin ou
est déclaré comme clé `modelCatalog.aliases` ciblant un fournisseur possédé. Les hooks de suppression
runtime ne sont plus appelés pendant la résolution des modèles.

Champs de fournisseur :

| Champ     | Type                     | Signification                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL par défaut facultative pour les modèles de ce catalogue de fournisseur. |
| `api`     | `ModelApi`               | Adaptateur d’API par défaut facultatif pour les modèles de ce catalogue de fournisseur. |
| `headers` | `Record<string, string>` | En-têtes statiques facultatifs qui s’appliquent à ce catalogue de fournisseur. |
| `models`  | `object[]`               | Lignes de modèle requises. Les lignes sans `id` sont ignorées.    |

Champs de modèle :

| Champ           | Type                                                           | Signification                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID de modèle propre au fournisseur, sans le préfixe `provider/`.                    |
| `name`          | `string`                                                       | Nom d’affichage facultatif.                                                      |
| `api`           | `ModelApi`                                                     | Remplacement facultatif de l’API par modèle.                                            |
| `baseUrl`       | `string`                                                       | Remplacement facultatif de l’URL de base par modèle.                                       |
| `headers`       | `Record<string, string>`                                       | En-têtes statiques facultatifs par modèle.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalités acceptées par le modèle.                                               |
| `reasoning`     | `boolean`                                                      | Indique si le modèle expose un comportement de raisonnement.                               |
| `contextWindow` | `number`                                                       | Fenêtre de contexte native du fournisseur.                                             |
| `contextTokens` | `number`                                                       | Plafond de contexte d’exécution effectif facultatif lorsqu’il diffère de `contextWindow`. |
| `maxTokens`     | `number`                                                       | Nombre maximal de jetons de sortie lorsqu’il est connu.                                           |
| `cost`          | `object`                                                       | Tarification facultative en USD par million de jetons, avec `tieredPricing` facultatif. |
| `compat`        | `object`                                                       | Indicateurs de compatibilité facultatifs correspondant à la compatibilité de configuration des modèles OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | État du listage. Ne supprimer que lorsque la ligne ne doit pas apparaître du tout.          |
| `statusReason`  | `string`                                                       | Raison facultative affichée avec un état non disponible.                            |
| `replaces`      | `string[]`                                                     | Anciens ID de modèles propres au fournisseur que ce modèle remplace.                       |
| `replacedBy`    | `string`                                                       | ID de modèle propre au fournisseur remplaçant les lignes obsolètes.                    |
| `tags`          | `string[]`                                                     | Étiquettes stables utilisées par les sélecteurs et les filtres.                                    |

Champs de suppression :

| Champ                      | Type       | Signification                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | ID de fournisseur pour la ligne amont à supprimer. Doit appartenir à ce plugin ou être déclaré comme alias possédé. |
| `model`                    | `string`   | ID de modèle propre au fournisseur à supprimer.                                                                      |
| `reason`                   | `string`   | Message facultatif affiché lorsque la ligne supprimée est demandée directement.                                     |
| `when.baseUrlHosts`        | `string[]` | Liste facultative des hôtes d’URL de base effectifs du fournisseur requis avant que la suppression s’applique.               |
| `when.providerConfigApiIn` | `string[]` | Liste facultative des valeurs exactes `api` de configuration du fournisseur requises avant que la suppression s’applique.              |

Ne placez pas de données uniquement d’exécution dans `modelCatalog`. Utilisez `static` uniquement lorsque les
lignes du manifeste sont assez complètes pour permettre aux surfaces de listes filtrées par fournisseur et aux sélecteurs d’ignorer
la découverte par registre/exécution. Utilisez `refreshable` lorsque les lignes du manifeste sont des
amorces ou compléments listables utiles, mais qu’un rafraîchissement/cache peut ajouter davantage de lignes plus tard ;
les lignes rafraîchissables ne font pas autorité à elles seules. Utilisez `runtime` lorsqu’OpenClaw
doit charger l’exécution du fournisseur pour connaître la liste.

## Référence modelIdNormalization

Utilisez `modelIdNormalization` pour un nettoyage peu coûteux des ID de modèles appartenant au fournisseur qui doit
se produire avant le chargement de l’exécution du fournisseur. Cela conserve les alias tels que les noms de modèles
courts, les anciens ID propres au fournisseur et les règles de préfixe de proxy dans le manifeste du plugin propriétaire
au lieu des tables centrales de sélection de modèles.

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
| `aliases`                            | `Record<string,string>` | Alias exacts d’ID de modèle, insensibles à la casse. Les valeurs sont renvoyées telles qu’écrites.                  |
| `stripPrefixes`                      | `string[]`              | Préfixes à supprimer avant la recherche d’alias, utiles pour l’ancienne duplication fournisseur/modèle.     |
| `prefixWhenBare`                     | `string`                | Préfixe à ajouter lorsque l’ID de modèle normalisé ne contient pas déjà `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | Règles conditionnelles de préfixe d’ID nu après la recherche d’alias, indexées par `modelPrefix` et `prefix`. |

## Référence providerEndpoints

Utilisez `providerEndpoints` pour la classification des points de terminaison que la politique générique de requête
doit connaître avant le chargement de l’exécution du fournisseur. Le cœur possède toujours la signification de chaque
`endpointClass` ; les manifestes de plugins possèdent les métadonnées d’hôte et d’URL de base.

Champs du point de terminaison :

| Champ                          | Type       | Signification                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | Classe de point de terminaison centrale connue, comme `openrouter`, `moonshot-native` ou `google-vertex`.        |
| `hosts`                        | `string[]` | Noms d’hôtes exacts qui correspondent à la classe de point de terminaison.                                                |
| `hostSuffixes`                 | `string[]` | Suffixes d’hôte qui correspondent à la classe de point de terminaison. Préfixez avec `.` pour une correspondance limitée aux suffixes de domaine. |
| `baseUrls`                     | `string[]` | URL de base HTTP(S) normalisées exactes qui correspondent à la classe de point de terminaison.                             |
| `googleVertexRegion`           | `string`   | Région Google Vertex statique pour les hôtes globaux exacts.                                            |
| `googleVertexRegionHostSuffix` | `string`   | Suffixe à supprimer des hôtes correspondants pour exposer le préfixe de région Google Vertex.                 |

## Référence providerRequest

Utilisez `providerRequest` pour les métadonnées peu coûteuses de compatibilité des requêtes dont la politique générique
de requête a besoin sans charger l’exécution du fournisseur. Gardez la réécriture de charge utile
propre au comportement dans les hooks d’exécution du fournisseur ou les helpers partagés de famille de fournisseurs.

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
| `family`              | `string`     | Libellé de famille de fournisseur utilisé par les décisions et diagnostics génériques de compatibilité des requêtes. |
| `compatibilityFamily` | `"moonshot"` | Compartiment facultatif de compatibilité de famille de fournisseurs pour les helpers de requête partagés.              |
| `openAICompletions`   | `object`     | Indicateurs de requête de complétions compatibles OpenAI, actuellement `supportsStreamingUsage`.       |

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
| `external`   | `boolean`         | Définissez sur `false` pour les fournisseurs locaux/auto-hébergés qui ne doivent jamais récupérer les tarifs OpenRouter ou LiteLLM. |
| `openRouter` | `false \| object` | Mappage de recherche de tarification OpenRouter. `false` désactive la recherche OpenRouter pour ce fournisseur.           |
| `liteLLM`    | `false \| object` | Mappage de recherche de tarification LiteLLM. `false` désactive la recherche LiteLLM pour ce fournisseur.                 |

Champs de source :

| Champ                      | Type               | Signification                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | ID de fournisseur de catalogue externe lorsqu’il diffère de l’ID de fournisseur OpenClaw, par exemple `z-ai` pour un fournisseur `zai`. |
| `passthroughProviderModel` | `boolean`          | Traiter les ID de modèles contenant une barre oblique comme des références fournisseur/modèle imbriquées, utile pour les fournisseurs proxy tels qu’OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | Variantes supplémentaires d’ID de modèle du catalogue externe. `version-dots` essaie les ID de version avec points, comme `claude-opus-4.6`.            |

### Index des fournisseurs OpenClaw

L’index des fournisseurs OpenClaw est constitué de métadonnées d’aperçu appartenant à OpenClaw pour les fournisseurs
dont les plugins ne sont peut-être pas encore installés. Il ne fait pas partie d’un manifeste de plugin.
Les manifestes de plugins restent l’autorité des plugins installés. L’index des fournisseurs est
le contrat de repli interne que les futures surfaces de fournisseurs installables et de sélecteur de modèles
avant installation consommeront lorsqu’un plugin fournisseur n’est pas installé.

Ordre d’autorité du catalogue :

1. Configuration utilisateur.
2. `modelCatalog` du manifeste du plugin installé.
3. Cache du catalogue de modèles issu d’un rafraîchissement explicite.
4. Lignes d’aperçu de l’index des fournisseurs OpenClaw.

L’Index des fournisseurs ne doit pas contenir de secrets, d’état d’activation, de hooks de runtime ni de données de modèle en direct propres à un compte. Ses catalogues d’aperçu utilisent la même forme de ligne de fournisseur `modelCatalog` que les manifestes de plugins, mais doivent rester limités aux métadonnées d’affichage stables, sauf si des champs d’adaptateur de runtime tels que `api`, `baseUrl`, les tarifs ou les indicateurs de compatibilité sont intentionnellement maintenus alignés avec le manifeste du plugin installé. Les fournisseurs avec découverte `/models` en direct doivent écrire les lignes actualisées via le chemin explicite du cache de catalogue de modèles au lieu de faire appeler les API des fournisseurs par les flux normaux de liste ou de configuration initiale.

Les entrées de l’Index des fournisseurs peuvent aussi contenir des métadonnées de plugin installable pour les fournisseurs dont le plugin a été déplacé hors du cœur ou n’est pas encore installé autrement. Ces métadonnées reprennent le modèle du catalogue de canaux : le nom du package, la spécification d’installation npm, l’intégrité attendue et des libellés légers de choix d’authentification suffisent pour afficher une option de configuration installable. Une fois le plugin installé, son manifeste prévaut et l’entrée de l’Index des fournisseurs est ignorée pour ce fournisseur.

Les anciennes clés de capacité de premier niveau sont obsolètes. Utilisez `openclaw doctor --fix` pour déplacer `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal des manifestes ne traite plus ces champs de premier niveau comme une propriété de capacité.

## Manifeste contre package.json

Les deux fichiers ont des rôles différents :

| Fichier                | À utiliser pour                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’interface qui doivent exister avant l’exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, les garde-fous d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, appliquez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, mettez-la dans `openclaw.plugin.json`
- si elle concerne l’empaquetage, les fichiers d’entrée ou le comportement d’installation npm, mettez-la dans `package.json`

### Champs de package.json qui affectent la découverte

Certaines métadonnées de plugin pré-runtime résident intentionnellement dans `package.json`, sous le bloc `openclaw`, plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Déclare les points d’entrée natifs du plugin. Doit rester dans le répertoire du package du plugin.                                                                                   |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée de runtime JavaScript compilés pour les packages installés. Doit rester dans le répertoire du package du plugin.                                         |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration, utilisé pendant la configuration initiale, le démarrage différé des canaux et la découverte en lecture seule de l’état du canal/des SecretRef. Doit rester dans le répertoire du package du plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Doit rester dans le répertoire du package du plugin.                                      |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canaux, comme les libellés, chemins de documentation, alias et textes de sélection.                                                              |
| `openclaw.channel.commands`                                       | Métadonnées statiques de commandes natives et d’activation automatique par défaut des compétences natives, utilisées par les surfaces de configuration, d’audit et de liste de commandes avant le chargement du runtime du canal. |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification de l’état configuré pouvant répondre à « une configuration par env existe-t-elle déjà ? » sans charger le runtime complet du canal.              |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification d’authentification persistée pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal.               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/de mise à jour pour les plugins groupés et publiés en externe.                                                                                           |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                            |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, avec un plancher semver comme `>=2026.3.22`.                                                                                   |
| `openclaw.install.expectedIntegrity`                              | Chaîne d’intégrité npm dist attendue, comme `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à celle-ci.                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation d’un plugin groupé lorsque la configuration est invalide.                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet pendant le démarrage.                                                       |

Les métadonnées de manifeste déterminent les choix de fournisseur/canal/configuration qui apparaissent dans la configuration initiale avant le chargement du runtime. `package.json#openclaw.install` indique à la configuration initiale comment récupérer ou activer ce plugin lorsque l’utilisateur choisit l’une de ces options. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre de manifestes. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides ignorent le plugin sur les hôtes plus anciens.

L’épinglage exact de version npm existe déjà dans `npmSpec`, par exemple `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles de catalogue externe doivent associer des spécifications exactes à `expectedIntegrity` afin que les flux de mise à jour échouent de manière fermée si l’artefact npm récupéré ne correspond plus à la version épinglée. La configuration initiale interactive propose toujours des spécifications npm de registre de confiance, y compris les noms de packages nus et les dist-tags, pour compatibilité. Les diagnostics de catalogue peuvent distinguer les sources exactes, flottantes, épinglées par intégrité, sans intégrité, avec nom de package incompatible et avec choix par défaut invalide. Ils avertissent aussi lorsque `expectedIntegrity` est présent mais qu’aucune source npm valide ne peut être épinglée par celui-ci. Lorsque `expectedIntegrity` est présent, les flux d’installation/de mise à jour l’appliquent ; lorsqu’il est omis, la résolution du registre est enregistrée sans épinglage d’intégrité.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque les analyses d’état, de liste de canaux ou de SecretRef doivent identifier les comptes configurés sans charger le runtime complet. L’entrée de configuration doit exposer les métadonnées de canal ainsi que des adaptateurs de configuration, d’état et de secrets sûrs pour la configuration ; gardez les clients réseau, les écouteurs de Gateway et les runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée de runtime ne remplacent pas les contrôles de frontière de package pour les champs de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un chemin `openclaw.extensions` qui s’échappe.

`openclaw.install.allowInvalidConfigRecovery` est intentionnellement étroit. Il ne rend pas installables les configurations arbitrairement cassées. Aujourd’hui, il permet seulement aux flux d’installation de récupérer après des échecs précis de mise à niveau de plugins groupés obsolètes, comme un chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même plugin groupé. Les erreurs de configuration sans rapport bloquent toujours l’installation et dirigent les opérateurs vers `openclaw doctor --fix`.

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

Utilisez-la lorsque les flux de configuration, doctor, état ou présence en lecture seule ont besoin d’une sonde d’authentification oui/non légère avant le chargement du plugin de canal complet. L’état d’authentification persisté n’est pas l’état de canal configuré : n’utilisez pas ces métadonnées pour activer automatiquement des plugins, réparer des dépendances de runtime ou décider si un runtime de canal doit se charger. L’export cible doit être une petite fonction qui lit uniquement l’état persisté ; ne l’acheminez pas via le barrel du runtime de canal complet.

`openclaw.channel.configuredState` suit la même forme pour les vérifications légères de configuration uniquement par env :

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

Utilisez-la lorsqu’un canal peut répondre à l’état configuré à partir d’env ou d’autres minuscules entrées hors runtime. Si la vérification nécessite une résolution complète de la configuration ou le vrai runtime de canal, gardez cette logique dans le hook `config.hasConfiguredState` du plugin à la place.

## Priorité de découverte (identifiants de plugin en double)

OpenClaw découvre les plugins depuis plusieurs racines (groupés, installation globale, workspace, chemins explicitement sélectionnés par configuration). Si deux découvertes partagent le même `id`, seul le manifeste de **plus haute priorité** est conservé ; les doublons de priorité inférieure sont abandonnés au lieu d’être chargés à côté de lui.

Priorité, de la plus élevée à la plus basse :

1. **Sélectionné par configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Groupé** — plugins livrés avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Workspace** — plugins découverts relativement au workspace courant

Implications :

- Une copie forkée ou obsolète d’un plugin groupé présente dans le workspace ne masquera pas la compilation groupée.
- Pour réellement remplacer un plugin groupé par un plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par priorité au lieu de vous appuyer sur la découverte du workspace.
- Les abandons de doublons sont journalisés afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque plugin doit livrer un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas au runtime.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’id du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des ids de plugin **découvrables**. Les ids inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les journaux.

Consultez la [référence de configuration](/fr/gateway/configuration) pour le schéma `plugins.*` complet.

## Notes

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local. Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez les clés de premier niveau personnalisées.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerDiscoveryEntry` doit rester léger et ne doit pas importer de code runtime étendu ; utilisez-le pour des métadonnées statiques de catalogue de fournisseurs ou des descripteurs de découverte ciblés, pas pour l’exécution au moment de la requête.
- Les types de plugins exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (`legacy` par défaut).
- Déclarez le type de plugin exclusif dans ce manifeste. `OpenClawPluginDefinition.kind` de l’entrée runtime est obsolète et reste uniquement comme solution de compatibilité pour les anciens plugins.
- Les métadonnées de variables d’environnement (`setup.providers[].envVars`, `providerAuthEnvVars` obsolète et `channelEnvVars`) sont uniquement déclaratives. Le statut, l’audit, la validation de livraison Cron et les autres surfaces en lecture seule appliquent toujours la confiance du plugin et la politique d’activation effective avant de considérer une variable d’environnement comme configurée.
- Pour les métadonnées d’assistant runtime qui nécessitent du code fournisseur, consultez les [hooks runtime de fournisseur](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toutes les exigences de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Associés

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
