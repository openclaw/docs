---
read_when:
    - Vous créez un plugin OpenClaw
    - Vous devez livrer un schéma de configuration de plugin ou déboguer des erreurs de validation de plugin
summary: Manifeste de plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifeste de plugin
x-i18n:
    generated_at: "2026-04-09T01:29:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a7ee4b621a801d2a8f32f8976b0e1d9433c7810eb360aca466031fc0ffb286a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste de plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste de plugin natif OpenClaw**.

Pour les dispositions de bundle compatibles, voir [Bundles de plugins](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement aussi ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de skill déclarées, les racines de commande Claude, les valeurs par défaut `settings.json`
du bundle Claude, les valeurs par défaut LSP du bundle Claude et les packs de hooks pris en charge
lorsque la disposition correspond aux attentes du runtime OpenClaw.

Chaque plugin natif OpenClaw **doit** fournir un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme des
erreurs de plugin et bloquent la validation de la configuration.

Voir le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle natif de capacités et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Ce que fait ce fichier

`openclaw.plugin.json` est le jeu de métadonnées qu'OpenClaw lit avant de charger le
code de votre plugin.

Utilisez-le pour :

- l'identité du plugin
- la validation de la configuration
- les métadonnées d'authentification et d'onboarding qui doivent être disponibles sans démarrer le
  runtime du plugin
- les métadonnées d'alias et d'activation automatique qui doivent être résolues avant le chargement du runtime du plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent activer automatiquement le
  plugin avant le chargement du runtime
- les instantanés statiques de propriété de capacités utilisés pour le câblage de compatibilité groupé et
  la couverture des contrats
- les métadonnées de configuration spécifiques au canal qui doivent être fusionnées dans le catalogue et les surfaces de validation
  sans charger le runtime
- les indications d'interface pour la configuration

Ne l'utilisez pas pour :

- enregistrer un comportement d'exécution
- déclarer des points d'entrée de code
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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Oui      | `string`                         | ID canonique du plugin. C'est l'ID utilisé dans `plugins.entries.<id>`.                                                                                                                                     |
| `configSchema`                      | Oui      | `object`                         | Schéma JSON inline pour la configuration de ce plugin.                                                                                                                                                       |
| `enabledByDefault`                  | Non      | `true`                           | Marque un plugin groupé comme activé par défaut. Omettez-le, ou définissez n'importe quelle valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                          |
| `legacyPluginIds`                   | Non      | `string[]`                       | IDs hérités qui sont normalisés vers cet ID de plugin canonique.                                                                                                                                             |
| `autoEnableWhenConfiguredProviders` | Non      | `string[]`                       | IDs de fournisseur qui doivent activer automatiquement ce plugin lorsque l'authentification, la configuration ou les références de modèle les mentionnent.                                                  |
| `kind`                              | Non      | `"memory"` \| `"context-engine"` | Déclare un type exclusif de plugin utilisé par `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Non      | `string[]`                       | IDs de canal possédés par ce plugin. Utilisés pour la découverte et la validation de configuration.                                                                                                          |
| `providers`                         | Non      | `string[]`                       | IDs de fournisseur possédés par ce plugin.                                                                                                                                                                   |
| `modelSupport`                      | Non      | `object`                         | Métadonnées abrégées de famille de modèles détenues par le manifeste, utilisées pour charger automatiquement le plugin avant le runtime.                                                                    |
| `cliBackends`                       | Non      | `string[]`                       | IDs de backend d'inférence CLI possédés par ce plugin. Utilisés pour l'activation automatique au démarrage à partir de références de configuration explicites.                                              |
| `providerAuthEnvVars`               | Non      | `Record<string, string[]>`       | Métadonnées légères d'env d'authentification fournisseur qu'OpenClaw peut inspecter sans charger le code du plugin.                                                                                         |
| `providerAuthAliases`               | Non      | `Record<string, string>`         | IDs de fournisseur qui doivent réutiliser un autre ID de fournisseur pour la recherche d'authentification, par exemple un fournisseur de code qui partage la clé API et les profils d'auth du fournisseur de base. |
| `channelEnvVars`                    | Non      | `Record<string, string[]>`       | Métadonnées légères d'env de canal qu'OpenClaw peut inspecter sans charger le code du plugin. Utilisez-les pour une configuration de canal pilotée par l'env ou des surfaces d'auth que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`               | Non      | `object[]`                       | Métadonnées légères de choix d'authentification pour les sélecteurs d'onboarding, la résolution du fournisseur préféré et le câblage simple des flags CLI.                                                 |
| `contracts`                         | Non      | `object`                         | Instantané statique des capacités groupées pour la parole, la transcription temps réel, la voix en temps réel, la compréhension média, la génération d'images, la génération musicale, la génération vidéo, la récupération web, la recherche web et la propriété des outils. |
| `channelConfigs`                    | Non      | `Record<string, object>`         | Métadonnées de configuration de canal détenues par le manifeste et fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                              |
| `skills`                            | Non      | `string[]`                       | Répertoires de skill à charger, relatifs à la racine du plugin.                                                                                                                                             |
| `name`                              | Non      | `string`                         | Nom lisible du plugin.                                                                                                                                                                                       |
| `description`                       | Non      | `string`                         | Court résumé affiché dans les surfaces de plugin.                                                                                                                                                            |
| `version`                           | Non      | `string`                         | Version informative du plugin.                                                                                                                                                                               |
| `uiHints`                           | Non      | `Record<string, object>`         | Libellés d'interface, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                          |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d'onboarding ou d'authentification.
OpenClaw la lit avant que le runtime fournisseur ne se charge.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui      | `string`                                        | ID du fournisseur auquel appartient ce choix.                                                            |
| `method`              | Oui      | `string`                                        | ID de la méthode d'authentification vers laquelle router.                                                |
| `choiceId`            | Oui      | `string`                                        | ID stable de choix d'authentification utilisé par les flux d'onboarding et CLI.                          |
| `choiceLabel`         | Non      | `string`                                        | Libellé destiné à l'utilisateur. S'il est omis, OpenClaw revient à `choiceId`.                          |
| `choiceHint`          | Non      | `string`                                        | Court texte d'aide pour le sélecteur.                                                                    |
| `assistantPriority`   | Non      | `number`                                        | Les valeurs les plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l'assistant. |
| `assistantVisibility` | Non      | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l'assistant tout en autorisant la sélection manuelle via CLI.    |
| `deprecatedChoiceIds` | Non      | `string[]`                                      | IDs hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.               |
| `groupId`             | Non      | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                   |
| `groupLabel`          | Non      | `string`                                        | Libellé destiné à l'utilisateur pour ce groupe.                                                          |
| `groupHint`           | Non      | `string`                                        | Court texte d'aide pour le groupe.                                                                       |
| `optionKey`           | Non      | `string`                                        | Clé d'option interne pour les flux d'authentification simples à un seul flag.                            |
| `cliFlag`             | Non      | `string`                                        | Nom du flag CLI, par exemple `--openrouter-api-key`.                                                     |
| `cliOption`           | Non      | `string`                                        | Forme complète de l'option CLI, par exemple `--openrouter-api-key <key>`.                                |
| `cliDescription`      | Non      | `string`                                        | Description utilisée dans l'aide CLI.                                                                     |
| `onboardingScopes`    | Non      | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d'onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

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

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé du champ destiné à l'utilisateur. |
| `help`        | `string`   | Court texte d'aide.                     |
| `tags`        | `string[]` | Tags d'interface facultatifs.           |
| `advanced`    | `boolean`  | Marque le champ comme avancé.           |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte de placeholder pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacités qu'OpenClaw peut
lire sans importer le runtime du plugin.

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

| Field                            | Type       | What it means                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de fournisseur de parole possédés par ce plugin.           |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseur de transcription en temps réel possédés par ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseur de voix en temps réel possédés par ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseur de compréhension média possédés par ce plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseur de génération d'images possédés par ce plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseur de génération vidéo possédés par ce plugin. |
| `webFetchProviders`              | `string[]` | IDs de fournisseur de récupération web possédés par ce plugin. |
| `webSearchProviders`             | `string[]` | IDs de fournisseur de recherche web possédés par ce plugin.    |
| `tools`                          | `string[]` | Noms d'outils d'agent possédés par ce plugin pour les vérifications de contrat groupées. |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu'un plugin de canal a besoin de métadonnées de configuration légères avant
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

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée déclarée de configuration de canal. |
| `uiHints`     | `Record<string, object>` | Libellés d'interface/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d'inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d'inspection et de catalogue.              |
| `preferOver`  | `string[]`               | IDs de plugin hérités ou de priorité inférieure que ce canal doit surpasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsque OpenClaw doit déduire votre plugin fournisseur à partir
d'IDs de modèle abrégés comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement du runtime du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique l'ordre de priorité suivant :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` du propriétaire
- `modelPatterns` l'emporte sur `modelPrefixes`
- si un plugin non groupé et un plugin groupé correspondent tous deux, le plugin non groupé
  l'emporte
- l'ambiguïté restante est ignorée jusqu'à ce que l'utilisateur ou la configuration spécifie un fournisseur

Champs :

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs de modèle abrégés.                  |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs de modèle abrégés après suppression du suffixe de profil. |

Les clés de capacité héritées de niveau supérieur sont dépréciées. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de niveau supérieur comme
propriété de capacités.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d'authentification et indications d'interface qui doivent exister avant l'exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d'entrée, le contrôle d'installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, appliquez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d'entrée ou le comportement d'installation npm, placez-la dans `package.json`

### Champs package.json qui affectent la découverte

Certaines métadonnées de plugin pré-runtime vivent intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Field                                                             | What it means                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d'entrée des plugins natifs.                                                                                              |
| `openclaw.setupEntry`                                             | Point d'entrée léger réservé à la configuration, utilisé pendant l'onboarding et le démarrage différé des canaux.                          |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal comme les libellés, les chemins de documentation, les alias et le texte de sélection.            |
| `openclaw.channel.configuredState`                                | Métadonnées légères du vérificateur d'état configuré qui peuvent répondre à « une configuration env-only existe-t-elle déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères du vérificateur d'authentification persistée qui peuvent répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d'installation/mise à jour pour les plugins groupés et publiés de façon externe.                                               |
| `openclaw.install.defaultChoice`                                  | Chemin d'installation préféré lorsque plusieurs sources d'installation sont disponibles.                                                    |
| `openclaw.install.minHostVersion`                                 | Version hôte minimale prise en charge par OpenClaw, à l'aide d'un plancher semver comme `>=2026.3.22`.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin de récupération étroit pour la réinstallation de plugins groupés lorsque la configuration est invalide.                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet au démarrage.                    |

`openclaw.install.minHostVersion` est appliqué pendant l'installation et le chargement du registre
de manifestes. Les valeurs invalides sont rejetées ; les valeurs valides mais plus récentes ignorent le
plugin sur les hôtes plus anciens.

`openclaw.install.allowInvalidConfigRecovery` est volontairement limité. Il
ne rend pas installables des configurations arbitrairement cassées. Aujourd'hui, il permet uniquement aux flux d'installation
de récupérer après certains échecs obsolètes de mise à niveau de plugins groupés, comme un
chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin groupé. Les erreurs de configuration sans rapport bloquent toujours l'installation et envoient les opérateurs
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

Utilisez-la lorsque les flux de configuration, de doctor ou d'état configuré ont besoin d'une
vérification légère oui/non de l'authentification avant que le plugin de canal complet ne soit chargé. L'export cible doit être une petite
fonction qui lit uniquement l'état persisté ; ne la faites pas passer par le barrel runtime complet
du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères d'état
configuré env-only :

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

Utilisez-la lorsqu'un canal peut répondre à l'état configuré à partir de l'env ou d'autres petites
entrées non runtime. Si la vérification nécessite une résolution complète de la configuration ou le vrai
runtime du canal, gardez cette logique dans le hook de plugin `config.hasConfiguredState`
à la place.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s'il n'accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l'exécution.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l'ID de canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des IDs de plugin **découvrables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l'erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les logs.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Notes

- Le manifeste est **obligatoire pour les plugins natifs OpenClaw**, y compris les chargements depuis le système de fichiers local.
- Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à
  la découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les
  clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d'ajouter
  ici des clés personnalisées de niveau supérieur.
- `providerAuthEnvVars` est le chemin de métadonnées léger pour les sondes d'authentification, la
  validation des marqueurs d'env et les surfaces similaires d'authentification fournisseur qui ne doivent pas démarrer le runtime du plugin
  juste pour inspecter les noms d'env.
- `providerAuthAliases` permet à des variantes de fournisseur de réutiliser l'authentification
  d'un autre fournisseur : variables d'environnement, profils d'authentification, auth basée sur la configuration et choix
  d'onboarding par clé API, sans coder en dur cette relation dans le core.
- `channelEnvVars` est le chemin de métadonnées léger pour les replis shell-env, les invites de configuration
  et les surfaces similaires de canal qui ne doivent pas démarrer le runtime du plugin
  juste pour inspecter les noms d'env.
- `providerAuthChoices` est le chemin de métadonnées léger pour les sélecteurs de choix d'authentification,
  la résolution de `--auth-choice`, la correspondance du fournisseur préféré et l'enregistrement simple
  des flags CLI d'onboarding avant le chargement du runtime fournisseur. Pour les métadonnées d'assistant runtime
  qui nécessitent du code fournisseur, voir
  [Hooks runtime fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu'un
  plugin n'en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute
  exigence de liste d'autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Liens associés

- [Créer des plugins](/fr/plugins/building-plugins) — prise en main des plugins
- [Architecture des plugins](/fr/plugins/architecture) — architecture interne
- [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de plugin
