---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre `setup-entry.ts` par rapport à `index.ts`
    - Vous définissez des schémas de configuration du Plugin ou des métadonnées `openclaw` dans `package.json`
sidebarTitle: Setup and Config
summary: Assistants de configuration, `setup-entry.ts`, schémas de configuration et métadonnées de `package.json`
title: Configuration et config du Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuration et config du Plugin

Référence pour le packaging des Plugins (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les entrées de configuration et les schémas de config.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte :
  [Plugins de canaux](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de Plugin ce
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

**Plugin de fournisseur / référence de publication ClawHub :**

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
sont obligatoires. Les extraits canoniques de publication se trouvent dans
`docs/snippets/plugin-publish/`.

### Champs `openclaw`

| Champ        | Type       | Description                                                                                              |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                             |
| `setupEntry` | `string`   | Entrée légère réservée à la configuration (facultatif)                                                   |
| `channel`    | `object`   | Métadonnées du catalogue de canaux pour les surfaces de configuration, de sélection, de démarrage rapide et d’état |
| `providers`  | `string[]` | Identifiants de fournisseurs enregistrés par ce Plugin                                                   |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicateurs de comportement au démarrage                                                                 |

### `openclaw.channel`

`openclaw.channel` correspond à des métadonnées de package peu coûteuses pour la découverte des canaux et les
surfaces de configuration avant le chargement de l’exécution.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Identifiant canonique du canal.                                                |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/de la configuration lorsqu’il doit différer de `label`.   |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.       |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens vers la documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Brève description d’onboarding/de catalogue.                                   |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                 |
| `preferOver`                           | `string[]` | Identifiants de Plugin/canal de priorité inférieure que ce canal doit dépasser. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/d’image système pour les catalogues d’interface des canaux. |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens vers la documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées dans le texte de sélection.           |
| `markdownCapable`                      | `boolean`  | Indique que le canal prend en charge le Markdown pour les décisions de mise en forme sortante. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour la configuration, les listes configurées et les surfaces de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Active pour ce canal le flux standard de configuration rapide `allowFrom`.     |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison explicite de compte même lorsqu’un seul compte existe.       |
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
- `setup` : inclure le canal dans les sélecteurs interactifs de configuration/configurer
- `docs` : marquer le canal comme visible publiquement dans les surfaces de documentation/navigation

`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez
`exposure`.

### `openclaw.install`

`openclaw.install` est une métadonnée de package, pas une métadonnée de manifeste.

| Champ                        | Type                 | Signification                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/de mise à jour.          |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou intégré.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                 |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.              |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de Plugins intégrés de récupérer de certaines erreurs de configuration obsolète. |

Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent tous deux.
Les hôtes plus anciens ignorent le Plugin ; les chaînes de version invalides sont rejetées.

`allowInvalidConfigRecovery` n’est pas un contournement général pour des configurations cassées. Il sert
uniquement à une récupération ciblée pour les Plugins intégrés, afin que la réinstallation/la configuration puisse corriger des restes connus de mise à niveau comme un chemin de Plugin intégré manquant ou une entrée `channels.<id>`
obsolète pour ce même Plugin. Si la configuration est cassée pour des raisons sans rapport, l’installation
échoue quand même de manière sûre et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

### Chargement complet différé

Les Plugins de canaux peuvent activer le chargement différé avec :

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

Lorsqu’elle est activée, OpenClaw charge uniquement `setupEntry` pendant la phase de démarrage avant l’écoute,
même pour les canaux déjà configurés. Le point d’entrée complet est chargé une fois que la Gateway commence à écouter.

<Warning>
  N’activez le chargement différé que si votre `setupEntry` enregistre tout ce dont la
  Gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP,
  méthodes Gateway). Si le point d’entrée complet possède des capacités de démarrage requises, conservez
  le comportement par défaut.
</Warning>

Si votre entrée de configuration/complète enregistre des méthodes RPC Gateway, conservez-les sur un
préfixe spécifique au Plugin. Les espaces de noms d’administration du cœur réservés (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent la propriété du cœur et sont toujours résolus
vers `operator.admin`.

## Manifeste du Plugin

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

Pour les Plugins de canaux, ajoutez `kind` et `channels` :

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

Même les Plugins sans configuration doivent fournir un schéma. Un schéma vide est valide :

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Voir [Manifeste du Plugin](/fr/plugins/manifest) pour la référence complète du schéma.

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
OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration (onboarding, réparation de config,
inspection des canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques de chiffrement, enregistrements CLI,
services en arrière-plan) pendant les flux de configuration.

Les canaux d’espace de travail intégrés qui conservent des exports sûrs pour la configuration dans des modules annexes peuvent
utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` au lieu de
`defineSetupPluginEntry(...)`. Ce contrat intégré prend également en charge un export `runtime`
facultatif afin que le câblage de l’exécution au moment de la configuration reste léger et explicite.

**Quand OpenClaw utilise `setupEntry` au lieu du point d’entrée complet :**

- Le canal est désactivé mais a besoin de surfaces de configuration/d’onboarding
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet Plugin de canal (via `defineSetupPluginEntry`)
- Toute route HTTP requise avant l’écoute de la Gateway
- Toute méthode Gateway nécessaire au démarrage

Ces méthodes Gateway de démarrage doivent toujours éviter les espaces de noms d’administration du cœur
réservés tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services en arrière-plan
- Imports d’exécution lourds (chiffrement, SDK)
- Méthodes Gateway nécessaires uniquement après le démarrage

### Imports d’assistants de configuration ciblés

Pour les chemins critiques réservés à la configuration, préférez les points d’accès d’assistants de configuration ciblés plutôt que le point d’accès plus large
`plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’import                    | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants d’exécution au moment de la configuration qui restent disponibles dans `setupEntry` / le démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de compte sensibles à l’environnement                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/documentation de configuration/installation                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Utilisez le point d’accès plus large `plugin-sdk/setup` lorsque vous souhaitez l’ensemble complet de la boîte à outils de configuration partagée, y compris les assistants de correctif de configuration tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de correctif de configuration restent sûrs à l’importation sur les chemins critiques. Leur
recherche de surface de contrat de promotion de compte unique intégrée est paresseuse ; ainsi, l’import de
`plugin-sdk/setup-runtime` ne charge pas de manière anticipée la découverte de surface de contrat intégrée avant l’utilisation effective de l’adaptateur.

### Promotion de compte unique gérée par le canal

Lorsqu’un canal passe d’une config de niveau supérieur à compte unique à
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les
valeurs promues de portée compte dans `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de configuration :

- `singleAccountKeysToMove` : clés supplémentaires de niveau supérieur qui doivent être déplacées vers le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées vers le compte promu ; les clés partagées de stratégie/de distribution restent à la racine
  du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple intégré actuel. Si exactement un compte Matrix nommé existe déjà,
ou si `defaultAccount` pointe vers une clé existante non canonique telle que
`Ops`, la promotion préserve ce compte au lieu de créer une nouvelle
entrée `accounts.default`.

## Schéma de config

La config du Plugin est validée par rapport au schéma JSON de votre manifeste. Les utilisateurs
configurent les Plugins via :

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

Votre Plugin reçoit cette config sous la forme de `api.pluginConfig` lors de l’enregistrement.

Pour une config spécifique au canal, utilisez plutôt la section de config du canal :

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

### Création de schémas de config de canal

Utilisez `buildChannelConfigSchema` depuis `openclaw/plugin-sdk/core` pour convertir un
schéma Zod en l’enveloppe `ChannelConfigSchema` que OpenClaw valide :

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

Les Plugins de canaux peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`.
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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et plus encore.
Consultez les packages de Plugins intégrés (par exemple le Plugin Discord `src/channel.setup.ts`) pour
des exemples complets.

Pour les invites de liste d’autorisation de message direct qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et d’éventuelles
lignes supplémentaires, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de recréer à la main le même objet `status` dans
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

`plugin-sdk/channel-setup` expose également les constructeurs de plus bas niveau
`createOptionalChannelSetupAdapter(...)` et
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié
de cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue de manière sûre sur les vraies écritures de config. Ils
réutilisent un message unique indiquant qu’une installation est requise dans `validateInput`,
`applyAccountConfig`, et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est
défini.

Pour les interfaces de configuration adossées à un binaire, préférez les assistants délégués partagés au lieu de
copier la même logique de binaire/d’état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés,
  les indications, les scores et la détection du binaire
- `createCliPathTextInput(...)` pour les entrées de texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer vers
  un assistant complet plus lourd de manière paresseuse
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin que de
  déléguer une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d’abord ClawHub puis bascule automatiquement sur npm. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

Il n’existe pas d’équivalent pour le remplacement `npm:`. Utilisez la spécification normale du package npm lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les dans l’arborescence d’espace de travail des Plugins intégrés et ils seront automatiquement
découverts pendant la compilation.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations depuis npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (aucun script de cycle de vie). Gardez les arborescences de dépendances des Plugins
  en pur JS/TS et évitez les packages qui nécessitent des compilations `postinstall`.
</Info>

## Lié

- [Points d’entrée SDK](/fr/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste du Plugin](/fr/plugins/manifest) -- référence complète du schéma du manifeste
- [Création de Plugins](/fr/plugins/building-plugins) -- guide de démarrage pas à pas
