---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre `setup-entry.ts` par rapport à `index.ts`
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées `openclaw` dans `package.json`
sidebarTitle: Setup and Config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées package.json
title: Configuration et config du Plugin
x-i18n:
    generated_at: "2026-04-23T07:08:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuration et config du Plugin

Référence pour le packaging de Plugin (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les points d’entrée de configuration et les schémas de configuration.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging en contexte :
  [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Plugins fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de plugins ce
que votre Plugin fournit :

**Plugin de canal :**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin fournisseur / base de publication ClawHub :**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Si vous publiez le Plugin en externe sur ClawHub, ces champs `compat` et `build`
sont requis. Les extraits de publication canoniques se trouvent dans
`docs/snippets/plugin-publish/`.

### Champs `openclaw`

| Champ        | Type       | Description                                                                                                                  |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                                                 |
| `setupEntry` | `string`   | Entrée légère réservée à la configuration (facultatif)                                                                       |
| `channel`    | `object`   | Métadonnées de catalogue de canal pour les surfaces de configuration, sélection, démarrage rapide et état                  |
| `providers`  | `string[]` | IDs de fournisseur enregistrés par ce Plugin                                                                                 |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicateurs de comportement au démarrage                                                                                     |

### `openclaw.channel`

`openclaw.channel` est une métadonnée légère de package pour les surfaces de découverte et de configuration
de canal avant le chargement du runtime.

| Champ                                  | Type       | Signification                                                               |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canonique du canal.                                                      |
| `label`                                | `string`   | Libellé principal du canal.                                                 |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/de la configuration lorsqu’il doit différer de `label`. |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.    |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’ID du canal. |
| `blurb`                                | `string`   | Courte description d’onboarding/catalogue.                                  |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                 |
| `aliases`                              | `string[]` | Alias supplémentaires de recherche pour la sélection de canal.              |
| `preferOver`                           | `string[]` | IDs de plugin/canal de priorité inférieure que ce canal doit surpasser.     |
| `systemImage`                          | `string`   | Nom facultatif d’icône/system-image pour les catalogues UI de canaux.       |
| `selectionDocsPrefix`                  | `string`   | Texte de préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées au texte de sélection.             |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de configuration, de liste des éléments configurés et de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Fait entrer ce canal dans le flux standard de configuration `allowFrom` du démarrage rapide. |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison explicite de compte même lorsqu’un seul compte existe.    |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préfère la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

Exemple :

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` prend en charge :

- `configured` : inclure le canal dans les surfaces de liste de type configuré/état
- `setup` : inclure le canal dans les sélecteurs interactifs de configuration
- `docs` : marquer le canal comme visible publiquement dans les surfaces de documentation/navigation

`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez
`exposure`.

### `openclaw.install`

`openclaw.install` est une métadonnée de package, et non une métadonnée de manifeste.

| Champ                        | Type                 | Signification                                                                  |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.          |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou intégré.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.              |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.           |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité npm attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de plugin intégré de récupérer après certains échecs de configuration obsolète. |

L’onboarding interactif utilise aussi `openclaw.install` pour les surfaces
d’installation à la demande. Si votre Plugin expose des choix d’authentification fournisseur ou des
métadonnées de configuration/catalogue de canal avant le chargement du runtime, l’onboarding peut afficher ce choix,
demander npm ou local, installer ou activer le Plugin, puis continuer le
flux sélectionné. Les choix d’onboarding npm requièrent des métadonnées de catalogue de confiance avec une
version exacte de `npmSpec` et `expectedIntegrity` ; les noms de package non épinglés et les dist-tags
ne sont pas proposés pour les installations d’onboarding automatiques. Conservez les métadonnées « quoi afficher »
dans `openclaw.plugin.json` et les métadonnées « comment installer » dans
`package.json`.

Si `minHostVersion` est défini, le chargement de l’installation et du registre de manifeste l’appliquent tous deux.
Les hôtes plus anciens ignorent le Plugin ; les chaînes de version invalides sont rejetées.

Pour les installations npm épinglées, gardez la version exacte dans `npmSpec` et ajoutez
l’intégrité attendue de l’artefact :

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` n’est pas un contournement général des configurations cassées. Il est
réservé à la récupération étroite de plugins intégrés, afin que la réinstallation/configuration puisse réparer
des reliquats de mise à niveau connus comme un chemin de plugin intégré manquant ou une entrée
`channels.<id>` obsolète pour ce même plugin. Si la configuration est cassée pour des raisons non liées, l’installation
échoue toujours en mode fermé et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

### Chargement complet différé

Les plugins de canal peuvent opter pour le chargement différé avec :

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Lorsque cette option est activée, OpenClaw ne charge que `setupEntry` pendant la phase
de démarrage avant écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que la
Gateway commence à écouter.

<Warning>
  N’activez le chargement différé que si votre `setupEntry` enregistre tout ce dont la
  Gateway a besoin avant qu’elle ne commence à écouter (enregistrement de canal, routes HTTP,
  méthodes Gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez
  le comportement par défaut.
</Warning>

Si votre entrée setup/complète enregistre des méthodes Gateway RPC, gardez-les sous un
préfixe spécifique au Plugin. Les espaces de noms admin du cœur réservés (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent détenus par le cœur et se résolvent toujours
vers `operator.admin`.

## Manifeste de Plugin

Chaque Plugin natif doit fournir un `openclaw.plugin.json` à la racine du package.
OpenClaw l’utilise pour valider la configuration sans exécuter le code du Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Pour les plugins de canal, ajoutez `kind` et `channels` :

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Même les plugins sans configuration doivent fournir un schéma. Un schéma vide est valide :

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Voir [Manifeste de Plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de Plugin, utilisez la commande ClawHub spécifique au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L’ancien alias de publication réservé aux Skills concerne les Skills. Les packages de Plugin doivent
toujours utiliser `clawhub package publish`.

## Entrée de configuration

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration (onboarding, réparation de configuration,
inspection des canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code runtime lourd (bibliothèques de chiffrement, enregistrements CLI,
services en arrière-plan) pendant les flux de configuration.

Les canaux intégrés de l’espace de travail qui conservent des exports sûrs pour la configuration dans des modules sidecar peuvent
utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` au lieu de
`defineSetupPluginEntry(...)`. Ce contrat intégré prend aussi en charge un export
`runtime` facultatif afin que le câblage runtime au moment de la configuration reste léger et explicite.

**Quand OpenClaw utilise `setupEntry` au lieu de l’entrée complète :**

- Le canal est désactivé mais a besoin des surfaces de configuration/onboarding
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet plugin de canal (via `defineSetupPluginEntry`)
- Toutes les routes HTTP requises avant l’écoute de la Gateway
- Toutes les méthodes Gateway nécessaires au démarrage

Ces méthodes Gateway de démarrage doivent toujours éviter les espaces de noms admin
réservés du cœur tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services en arrière-plan
- Imports runtime lourds (crypto, SDK)
- Méthodes Gateway nécessaires uniquement après le démarrage

### Imports d’assistants de configuration étroits

Pour les chemins chauds réservés à la configuration, préférez les coutures étroites des assistants setup plutôt que la surface plus large
`plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’import                     | Utilisation                                                                            | Exports clés                                                                                                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | assistants runtime au moment de la configuration qui restent disponibles dans `setupEntry` / démarrage différé de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptateurs de configuration de compte sensibles à l’environnement                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`            | assistants CLI/archive/docs pour configuration/installation                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Utilisez la couture plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils complète partagée de configuration,
y compris les assistants de patch de configuration tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch setup restent sûrs pour le chemin chaud à l’import. Leur recherche intégrée paresseuse
de surface de contrat de promotion single-account signifie que l’import de
`plugin-sdk/setup-runtime` ne charge pas de manière anticipée la découverte de surface de contrat intégrée avant que l’adaptateur ne soit réellement utilisé.

### Promotion single-account détenue par le canal

Lorsqu’un canal passe d’une configuration single-account de niveau supérieur à
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les
valeurs promues limitées au compte dans `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion via leur surface de contrat
de configuration :

- `singleAccountKeysToMove` : clés supplémentaires de niveau supérieur qui doivent être déplacées dans le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées dans le compte promu ; les clés partagées de politique/livraison restent à la
  racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple intégré actuel. Si exactement un compte Matrix nommé existe déjà,
ou si `defaultAccount` pointe vers une clé non canonique existante telle que
`Ops`, la promotion conserve ce compte au lieu de créer une nouvelle entrée
`accounts.default`.

## Schéma de configuration

La configuration du Plugin est validée par rapport au schéma JSON dans votre manifeste. Les utilisateurs
configurent les plugins via :

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Votre Plugin reçoit cette configuration sous la forme `api.pluginConfig` pendant l’enregistrement.

Pour une configuration spécifique au canal, utilisez plutôt la section de configuration du canal :

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Construire des schémas de configuration de canal

Utilisez `buildChannelConfigSchema` depuis `openclaw/plugin-sdk/core` pour convertir un
schéma Zod en wrapper `ChannelConfigSchema` que valide OpenClaw :

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Assistants de configuration

Les plugins de canal peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`.
L’assistant est un objet `ChannelSetupWizard` sur le `ChannelPlugin` :

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, etc.
Voir les packages de plugins intégrés (par exemple le plugin Discord `src/channel.setup.ts`) pour
des exemples complets.

Pour les invites de liste d’autorisation DM qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration
partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, scores et lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de reconstruire à la main le même objet `status` dans
chaque Plugin.

Pour les surfaces de configuration facultatives qui ne doivent apparaître que dans certains contextes, utilisez
`createOptionalChannelSetupSurface` depuis `openclaw/plugin-sdk/channel-setup` :

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` expose aussi les constructeurs de plus bas niveau
`createOptionalChannelSetupAdapter(...)` et
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié de
cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue en mode fermé sur les vraies écritures de configuration. Ils
réutilisent un même message d’installation requise dans `validateInput`,
`applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est
défini.

Pour les UI de configuration adossées à des binaires, préférez les assistants partagés délégués au lieu
de recopier la même logique de binaire/état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés,
  les indications, les scores et la détection binaire
- `createCliPathTextInput(...)` pour les entrées texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transmettre paresseusement
  à un assistant complet plus lourd
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` doit seulement
  déléguer une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d’abord ClawHub puis revient automatiquement à npm. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub uniquement
```

Il n’existe pas de remplacement `npm:` équivalent. Utilisez la spécification normale de package npm lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins intégrés et ils sont automatiquement
découverts pendant la compilation.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations provenant de npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (aucun script de cycle de vie). Gardez les arbres
  de dépendances de Plugin en pur JS/TS et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

Les plugins intégrés détenus par OpenClaw sont la seule exception de réparation au démarrage : lorsqu’une
installation packagée en voit un activé par configuration de plugin, configuration héritée de canal, ou
par son manifeste intégré activé par défaut, le démarrage installe les dépendances runtime
manquantes de ce plugin avant l’import. Les plugins tiers ne doivent pas compter sur des installations au démarrage ; continuez à utiliser l’installateur explicite de plugin.

## Lié

- [Points d’entrée SDK](/fr/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste de Plugin](/fr/plugins/manifest) -- référence complète du schéma de manifeste
- [Créer des Plugins](/fr/plugins/building-plugins) -- guide pas à pas pour bien démarrer avec les plugins
