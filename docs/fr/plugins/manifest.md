---
read_when:
    - Vous créez un plugin OpenClaw
    - Vous devez fournir un schéma de configuration du plugin ou déboguer des erreurs de validation du plugin
summary: Exigences du manifeste du plugin + du schéma JSON (validation stricte de la configuration)
title: Manifeste du plugin
x-i18n:
    generated_at: "2026-04-12T06:49:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf666b0f41f07641375a248f52e29ba6a68c3ec20404bedb6b52a20a5cd92e91
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste du plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste natif de plugin OpenClaw**.

Pour les dispositions de bundles compatibles, voir [Bundles de plugins](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement ces dispositions de bundle également, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les racines de
skills déclarées, les racines de commandes Claude, les valeurs par défaut de `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes d'exécution d'OpenClaw.

Chaque plugin natif OpenClaw **doit** fournir un fichier `openclaw.plugin.json` dans la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes absents ou invalides sont traités comme
des erreurs de plugin et bloquent la validation de la configuration.

Voir le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle natif de capacités et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` est la métadonnée qu'OpenClaw lit avant de charger le code de votre
plugin.

Utilisez-le pour :

- l'identité du plugin
- la validation de la configuration
- les métadonnées d'authentification et d'intégration qui doivent être disponibles sans démarrer l'environnement d'exécution du plugin
- les indices d'activation peu coûteux que les surfaces du plan de contrôle peuvent inspecter avant le chargement de l'environnement d'exécution
- les descripteurs de configuration peu coûteux que les surfaces de configuration/intégration peuvent inspecter avant le chargement de l'environnement d'exécution
- les métadonnées d'alias et d'activation automatique qui doivent être résolues avant le chargement de l'environnement d'exécution du plugin
- les métadonnées abrégées de propriété de familles de modèles qui doivent activer automatiquement le plugin avant le chargement de l'environnement d'exécution
- les instantanés statiques de propriété des capacités utilisés pour le câblage de compatibilité des plugins intégrés et la couverture des contrats
- les métadonnées de configuration spécifiques aux canaux qui doivent être fusionnées dans les surfaces de catalogue et de validation sans charger l'environnement d'exécution
- les indications d'interface utilisateur pour la configuration

Ne l'utilisez pas pour :

- enregistrer le comportement à l'exécution
- déclarer les points d'entrée du code
- les métadonnées d'installation npm

Ces éléments appartiennent à votre code de plugin et à `package.json`.

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

## Référence des champs de premier niveau

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                                                |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Oui         | `string`                         | ID canonique du plugin. Il s'agit de l'ID utilisé dans `plugins.entries.<id>`.                                                                                                                              |
| `configSchema`                      | Oui         | `object`                         | Schéma JSON en ligne pour la configuration de ce plugin.                                                                                                                                                     |
| `enabledByDefault`                  | Non         | `true`                           | Indique qu'un plugin intégré est activé par défaut. Omettez-le, ou définissez une valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                   |
| `legacyPluginIds`                   | Non         | `string[]`                       | IDs hérités qui se normalisent vers cet ID canonique de plugin.                                                                                                                                              |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | IDs de fournisseurs qui doivent activer automatiquement ce plugin lorsque l'authentification, la configuration ou les références de modèle les mentionnent.                                                |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de plugin utilisé par `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Non         | `string[]`                       | IDs de canaux appartenant à ce plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                     |
| `providers`                         | Non         | `string[]`                       | IDs de fournisseurs appartenant à ce plugin.                                                                                                                                                                 |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de familles de modèles détenues par le manifeste, utilisées pour charger automatiquement le plugin avant l'environnement d'exécution.                                                  |
| `cliBackends`                       | Non         | `string[]`                       | IDs de backends d'inférence CLI appartenant à ce plugin. Utilisés pour l'activation automatique au démarrage à partir de références de configuration explicites.                                           |
| `commandAliases`                    | Non         | `object[]`                       | Noms de commandes appartenant à ce plugin qui doivent produire une configuration et des diagnostics CLI tenant compte du plugin avant le chargement de l'environnement d'exécution.                         |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées légères d'environnement d'authentification fournisseur qu'OpenClaw peut inspecter sans charger le code du plugin.                                                                              |
| `providerAuthAliases`               | Non         | `Record<string, string>`         | IDs de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d'authentification, par exemple un fournisseur de code qui partage la clé API et les profils d'authentification du fournisseur de base. |
| `channelEnvVars`                    | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d'environnement de canal qu'OpenClaw peut inspecter sans charger le code du plugin. Utilisez-les pour une configuration ou des surfaces d'authentification de canal pilotées par l'environnement que les aides génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées légères de choix d'authentification pour les sélecteurs d'intégration, la résolution des fournisseurs préférés et le raccordement simple des indicateurs CLI.                                  |
| `activation`                        | Non         | `object`                         | Indices d'activation peu coûteux pour le chargement déclenché par un fournisseur, une commande, un canal, une route ou une capacité. Métadonnées uniquement ; l'environnement d'exécution du plugin reste responsable du comportement réel. |
| `setup`                             | Non         | `object`                         | Descripteurs légers de configuration/intégration que les surfaces de découverte et de configuration peuvent inspecter sans charger l'environnement d'exécution du plugin.                                    |
| `contracts`                         | Non         | `object`                         | Instantané statique de capacités intégrées pour la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d'images, la génération de musique, la génération de vidéos, la récupération Web, la recherche Web, et la propriété des outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement de l'environnement d'exécution.                            |
| `skills`                            | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                             |
| `name`                              | Non         | `string`                         | Nom lisible du plugin.                                                                                                                                                                                       |
| `description`                       | Non         | `string`                         | Résumé court affiché dans les surfaces de plugin.                                                                                                                                                            |
| `version`                           | Non         | `string`                         | Version informative du plugin.                                                                                                                                                                               |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés d'interface, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                                       |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d'intégration ou d'authentification.
OpenClaw lit ceci avant le chargement de l'environnement d'exécution du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel ce choix appartient.                                                              |
| `method`              | Oui         | `string`                                        | ID de la méthode d'authentification vers laquelle effectuer le routage.                                    |
| `choiceId`            | Oui         | `string`                                        | ID stable de choix d'authentification utilisé par les flux d'intégration et de CLI.                       |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l'utilisateur. S'il est omis, OpenClaw utilise `choiceId` comme valeur de repli.       |
| `choiceHint`          | Non         | `string`                                        | Court texte d'aide pour le sélecteur.                                                                      |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs les plus faibles sont triées en premier dans les sélecteurs interactifs pilotés par l'assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque ce choix dans les sélecteurs de l'assistant tout en autorisant la sélection manuelle via la CLI.   |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | IDs hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.                 |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                     |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l'utilisateur pour ce groupe.                                                            |
| `groupHint`           | Non         | `string`                                        | Court texte d'aide pour le groupe.                                                                         |
| `optionKey`           | Non         | `string`                                        | Clé d'option interne pour les flux d'authentification simples à un seul indicateur.                       |
| `cliFlag`             | Non         | `string`                                        | Nom d'indicateur CLI, par exemple `--openrouter-api-key`.                                                  |
| `cliOption`           | Non         | `string`                                        | Forme complète de l'option CLI, par exemple `--openrouter-api-key <key>`.                                 |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l'aide de la CLI.                                                                |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d'intégration ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu'un plugin possède un nom de commande d'exécution que les utilisateurs peuvent
par erreur placer dans `plugins.allow` ou essayer d'exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code d'exécution du plugin.

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

| Champ        | Obligatoire | Type              | Signification                                                            |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Oui         | `string`          | Nom de commande appartenant à ce plugin.                                 |
| `kind`       | Non         | `"runtime-slash"` | Indique que l'alias est une commande slash de chat plutôt qu'une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l'activer plus tard.

Ce bloc contient uniquement des métadonnées. Il n'enregistre pas de comportement à l'exécution, et il ne
remplace pas `register(...)`, `setupEntry`, ni d'autres points d'entrée d'exécution/de plugin.

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

| Champ            | Obligatoire | Type                                                 | Signification                                                      |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Non         | `string[]`                                           | IDs de fournisseurs qui doivent activer ce plugin lorsqu'ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commandes qui doivent activer ce plugin.                    |
| `onChannels`     | Non         | `string[]`                                           | IDs de canaux qui doivent activer ce plugin.                       |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent activer ce plugin.                     |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indices généraux de capacités utilisés par la planification d'activation du plan de contrôle. |

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d'intégration ont besoin de métadonnées légères détenues par le plugin
avant le chargement de l'environnement d'exécution.

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

Le champ de premier niveau `cliBackends` reste valide et continue de décrire les
backends d'inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour les
flux de plan de contrôle/configuration qui doivent rester uniquement des métadonnées.

Lorsqu'ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
préférée basée sur les descripteurs pour la découverte de la configuration. Si le descripteur ne fait
que restreindre le plugin candidat et que la configuration a encore besoin de hooks d'exécution plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme
chemin d'exécution de repli.

Étant donné que la recherche de configuration peut exécuter du code `setup-api` détenu par le plugin, les valeurs normalisées
`setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les plugins
découverts. Une propriété ambiguë échoue de manière fermée au lieu de choisir un
gagnant selon l'ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Oui         | `string`   | ID du fournisseur exposé pendant la configuration ou l'intégration. Conservez des IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger l'environnement d'exécution complet. |
| `envVars`     | Non         | `string[]` | Variables d'environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement de l'environnement d'exécution du plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseurs exposés pendant la configuration et l'intégration.   |
| `cliBackends`      | Non         | `string[]` | IDs de backends au moment de la configuration utilisés pour la recherche de configuration basée d'abord sur les descripteurs. Conservez des IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration appartenant à la surface de configuration de ce plugin.           |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration nécessite encore l'exécution de `setup-api` après la recherche par descripteurs. |

## Référence `uiHints`

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

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé du champ destiné à l'utilisateur. |
| `help`        | `string`   | Court texte d'aide.                     |
| `tags`        | `string[]` | Balises d'interface facultatives.       |
| `advanced`    | `boolean`  | Marque le champ comme avancé.           |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d'espace réservé pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu'OpenClaw peut
lire sans importer l'environnement d'exécution du plugin.

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

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de fournisseurs vocaux appartenant à ce plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseurs de transcription en temps réel appartenant à ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseurs vocaux en temps réel appartenant à ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseurs de compréhension des médias appartenant à ce plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseurs de génération d'images appartenant à ce plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseurs de génération de vidéos appartenant à ce plugin. |
| `webFetchProviders`              | `string[]` | IDs de fournisseurs de récupération Web appartenant à ce plugin. |
| `webSearchProviders`             | `string[]` | IDs de fournisseurs de recherche Web appartenant à ce plugin.  |
| `tools`                          | `string[]` | Noms d'outils d'agent appartenant à ce plugin pour les vérifications de contrat des plugins intégrés. |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu'un plugin de canal a besoin de métadonnées de configuration légères avant le
chargement de l'environnement d'exécution.

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

| Champ         | Type                     | Signification                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée déclarée de configuration de canal. |
| `uiHints`     | `Record<string, object>` | Libellés d'interface, espaces réservés et indications de sensibilité facultatifs pour cette section de configuration du canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d'inspection lorsque les métadonnées d'exécution ne sont pas prêtes. |
| `description` | `string`                 | Description courte du canal pour les surfaces d'inspection et de catalogue.               |
| `preferOver`  | `string[]`               | IDs de plugins hérités ou de priorité inférieure que ce canal doit supplanter dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu'OpenClaw doit déduire votre plugin fournisseur à partir
d'IDs abrégés de modèles comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement de l'environnement d'exécution
du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cet ordre de priorité :

- les références explicites `provider/model` utilisent les métadonnées du manifeste `providers` propriétaire
- `modelPatterns` a priorité sur `modelPrefixes`
- si un plugin non intégré et un plugin intégré correspondent tous deux, le plugin non intégré
  l'emporte
- les ambiguïtés restantes sont ignorées jusqu'à ce que l'utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes mis en correspondance avec `startsWith` par rapport aux IDs abrégés de modèles. |
| `modelPatterns` | `string[]` | Sources regex mises en correspondance avec les IDs abrégés de modèles après suppression du suffixe de profil. |

Les clés héritées de capacités au niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de niveau supérieur comme propriété
de capacités.

## Manifeste versus package.json

Les deux fichiers remplissent des rôles différents :

| Fichier                | Utilisation                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de la configuration, métadonnées de choix d'authentification et indications d'interface qui doivent exister avant l'exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances, et bloc `openclaw` utilisé pour les points d'entrée, le contrôle d'installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où une métadonnée doit aller, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, mettez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d'entrée ou le comportement d'installation npm, mettez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de plugin avant exécution résident intentionnellement dans `package.json` sous le
bloc `openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d'entrée des plugins natifs.                                                                                              |
| `openclaw.setupEntry`                                             | Point d'entrée léger réservé à la configuration, utilisé pendant l'intégration et le démarrage différé des canaux.                          |
| `openclaw.channel`                                                | Métadonnées légères du catalogue de canaux comme les libellés, les chemins de documentation, les alias et le texte de sélection.          |
| `openclaw.channel.configuredState`                                | Métadonnées légères du vérificateur d'état configuré pouvant répondre à « une configuration uniquement par variables d'environnement existe-t-elle déjà ? » sans charger l'environnement d'exécution complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères du vérificateur d'authentification persistée pouvant répondre à « existe-t-il déjà une session connectée ? » sans charger l'environnement d'exécution complet du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d'installation/mise à jour pour les plugins intégrés et publiés en externe.                                                     |
| `openclaw.install.defaultChoice`                                  | Chemin d'installation préféré lorsque plusieurs sources d'installation sont disponibles.                                                     |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l'hôte OpenClaw, utilisant un plancher semver comme `>=2026.3.22`.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de réinstallation de récupération pour plugin intégré lorsque la configuration est invalide.                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet au démarrage.                    |

`openclaw.install.minHostVersion` est appliqué pendant l'installation et le
chargement du registre de manifestes. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides ignorent le
plugin sur les hôtes plus anciens.

`openclaw.install.allowInvalidConfigRecovery` est volontairement limité. Il ne
rend pas installables des configurations arbitrairement cassées. Aujourd'hui, il permet seulement aux flux d'installation
de se rétablir après certains échecs obsolètes de mise à niveau de plugins intégrés, comme un
chemin de plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin intégré. Les erreurs de configuration non liées bloquent toujours l'installation et redirigent les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule
module vérificateur :

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

Utilisez-le lorsque les flux de configuration, de doctor ou d'état configuré ont besoin d'une
sonde d'authentification légère oui/non avant le chargement du plugin de canal complet. L'export cible doit être une petite
fonction qui lit uniquement l'état persisté ; ne le faites pas passer par le barrel complet
de l'environnement d'exécution du canal.

`openclaw.channel.configuredState` suit la même forme pour les vérifications légères
d'état configuré uniquement par environnement :

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

Utilisez-le lorsqu'un canal peut répondre à l'état configuré à partir de l'environnement ou d'autres petites
entrées hors exécution. Si la vérification nécessite la résolution complète de la configuration ou le véritable
environnement d'exécution du canal, conservez plutôt cette logique dans le hook `config.hasConfiguredState`
du plugin.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s'il n'accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l'exécution.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l'ID du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des IDs de plugin **détectables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma manquant ou cassé,
  la validation échoue et Doctor signale l'erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor et dans les journaux.

Voir [Référence de la configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins natifs OpenClaw**, y compris les chargements depuis le système de fichiers local.
- L'environnement d'exécution charge toujours le module du plugin séparément ; le manifeste sert uniquement à
  la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et
  clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d'ajouter
  ici des clés personnalisées de niveau supérieur.
- `providerAuthEnvVars` est le chemin léger de métadonnées pour les sondes d'authentification, la
  validation des marqueurs d'environnement et des surfaces similaires d'authentification fournisseur qui ne doivent pas démarrer l'environnement d'exécution du plugin simplement pour inspecter les noms de variables d'environnement.
- `providerAuthAliases` permet aux variantes de fournisseurs de réutiliser les
  variables d'environnement d'authentification, profils d'authentification, authentification basée sur la configuration et choix
  d'intégration par clé API d'un autre fournisseur sans coder en dur cette relation dans le cœur.
- `channelEnvVars` est le chemin léger de métadonnées pour le repli sur les variables d'environnement du shell, les invites de configuration
  et les surfaces similaires de canal qui ne doivent pas démarrer l'environnement d'exécution du plugin
  simplement pour inspecter les noms de variables d'environnement.
- `providerAuthChoices` est le chemin léger de métadonnées pour les sélecteurs de choix d'authentification,
  la résolution `--auth-choice`, le mappage des fournisseurs préférés et l'enregistrement simple
  d'indicateurs CLI d'intégration avant le chargement de l'environnement d'exécution du fournisseur. Pour les métadonnées
  d'assistant à l'exécution qui nécessitent du code fournisseur, voir
  [Hooks d'exécution du fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de plugins sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu'un
  plugin n'en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build ainsi que toute
  exigence de liste d'autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Voir aussi

- [Créer des plugins](/fr/plugins/building-plugins) — démarrer avec les plugins
- [Architecture des plugins](/fr/plugins/architecture) — architecture interne
- [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK des plugins
