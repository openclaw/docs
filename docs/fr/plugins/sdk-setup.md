---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre `setup-entry.ts` par rapport à `index.ts`
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées `openclaw` dans package.json
sidebarTitle: Setup and Config
summary: Assistants de configuration, `setup-entry.ts`, schémas de configuration et métadonnées `package.json`
title: Configuration et config des Plugins
x-i18n:
    generated_at: "2026-04-25T13:54:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Référence pour le packaging des Plugin (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les entrées de configuration et les schémas de config.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte :
  [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de Plugin ce que
votre Plugin fournit :

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

**Plugin de fournisseur / base de publication ClawHub :**

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
sont obligatoires. Les extraits de publication canoniques se trouvent dans
`docs/snippets/plugin-publish/`.

### Champs `openclaw`

| Champ        | Type       | Description                                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                                                |
| `setupEntry` | `string`   | Entrée légère réservée à la configuration (facultatif)                                                                      |
| `channel`    | `object`   | Métadonnées du catalogue de canaux pour les surfaces de configuration, de sélection, de démarrage rapide et d’état         |
| `providers`  | `string[]` | IDs de fournisseurs enregistrés par ce Plugin                                                                               |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicateurs de comportement au démarrage                                                                                    |

### `openclaw.channel`

`openclaw.channel` est une métadonnée de package légère pour la découverte des canaux et les
surfaces de configuration avant le chargement à l’exécution.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canonique du canal.                                                         |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé de sélection/configuration lorsqu’il doit différer de `label`.         |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.       |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’ID du canal. |
| `blurb`                                | `string`   | Brève description d’intégration/catalogue.                                     |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                 |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de priorité inférieure que ce canal doit devancer.         |
| `systemImage`                          | `string`   | Nom d’icône/system-image facultatif pour les catalogues d’interface de canal.  |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de configuration, de listes configurées et de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Active pour ce canal le flux standard de configuration rapide `allowFrom`.     |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison de compte explicite même lorsqu’un seul compte existe.       |
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

| Champ                        | Type                 | Signification                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.            |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou intégré.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                 |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw au format `>=x.y.z`.                  |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité npm dist attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de Plugins intégrés de récupérer après certains échecs de configuration obsolète. |

L’intégration interactive utilise aussi `openclaw.install` pour les
surfaces d’installation à la demande. Si votre Plugin expose des choix d’authentification de fournisseur ou des métadonnées de configuration/catalogue de canal
avant le chargement à l’exécution, l’intégration peut afficher ce choix, proposer npm
ou une installation locale, installer ou activer le Plugin, puis poursuivre le
flux sélectionné. Les choix d’intégration npm exigent des métadonnées de catalogue fiables avec une
`npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épingles facultatives. Si
`expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent. Conservez les métadonnées « quoi
afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer »
dans `package.json`.

Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent tous deux.
Les hôtes plus anciens ignorent le Plugin ; les chaînes de version invalides sont rejetées.

Pour les installations npm épinglées, conservez la version exacte dans `npmSpec` et ajoutez l’
intégrité attendue de l’artefact :

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

`allowInvalidConfigRecovery` n’est pas un contournement général des configurations défectueuses. Il sert
uniquement à une récupération ciblée des Plugins intégrés, afin que la réinstallation/configuration puisse réparer des reliquats de mise à niveau connus, comme un chemin de Plugin intégré manquant ou une entrée `channels.<id>`
obsolète pour ce même Plugin. Si la configuration est défectueuse pour des raisons sans rapport, l’installation
échoue toujours en mode fermé et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

### Chargement complet différé

Les Plugins de canal peuvent activer le chargement différé avec :

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

Lorsqu’elle est activée, OpenClaw ne charge que `setupEntry` pendant la phase de démarrage
précédant l’écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que le
Gateway commence à écouter.

<Warning>
  N’activez le chargement différé que si votre `setupEntry` enregistre tout ce dont le
  Gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP,
  méthodes du Gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez
  le comportement par défaut.
</Warning>

Si votre entrée de configuration/complète enregistre des méthodes RPC Gateway, conservez-les sur un
préfixe spécifique au Plugin. Les espaces de noms d’administration cœur réservés (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent la propriété du cœur et se résolvent toujours
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

Pour les Plugins de canal, ajoutez `kind` et `channels` :

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

Consultez [Manifeste du Plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication sur ClawHub

Pour les packages de Plugin, utilisez la commande ClawHub spécifique au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L’ancien alias de publication réservé aux skills est destiné aux Skills. Les packages de Plugin doivent
toujours utiliser `clawhub package publish`.

## Entrée de configuration

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration (intégration, réparation de configuration,
inspection des canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques cryptographiques, enregistrements CLI,
services d’arrière-plan) pendant les flux de configuration.

Les canaux d’espace de travail intégrés qui conservent des exportations sûres pour la configuration dans des modules compagnons peuvent
utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` au lieu de
`defineSetupPluginEntry(...)`. Ce contrat intégré prend aussi en charge une exportation `runtime`
facultative afin que le câblage runtime au moment de la configuration reste léger et explicite.

**Quand OpenClaw utilise `setupEntry` au lieu de l’entrée complète :**

- Le canal est désactivé mais a besoin de surfaces de configuration/intégration
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet Plugin de canal (via `defineSetupPluginEntry`)
- Toutes les routes HTTP requises avant que le Gateway commence à écouter
- Toutes les méthodes Gateway nécessaires au démarrage

Ces méthodes Gateway de démarrage doivent toujours éviter les espaces de noms d’administration cœur réservés
tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services d’arrière-plan
- Importations runtime lourdes (crypto, SDK)
- Méthodes Gateway nécessaires uniquement après le démarrage

### Importations d’assistants de configuration ciblés

Pour les chemins chauds réservés à la configuration, préférez les interfaces d’assistants de configuration ciblées plutôt que la
surcouche plus large `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’importation               | À utiliser pour                                                                          | Exportations clés                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants runtime au moment de la configuration qui restent disponibles dans `setupEntry` / le démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de compte sensibles à l’environnement                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/documentation pour la configuration/l’installation                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Utilisez l’interface plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils complète de configuration partagée,
y compris des assistants de correctif de config tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de correctif de configuration restent sûrs à l’importation sur le chemin chaud. Leur
recherche intégrée de surface de contrat de promotion de compte unique est paresseuse ; ainsi, importer
`plugin-sdk/setup-runtime` ne charge pas de manière anticipée la découverte intégrée de surface de contrat
avant que l’adaptateur soit réellement utilisé.

### Promotion à compte unique propre au canal

Lorsqu’un canal passe d’une config de niveau supérieur à compte unique vers
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les
valeurs promues à portée de compte dans `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion via leur surface de contrat
de configuration :

- `singleAccountKeysToMove` : clés supplémentaires de niveau supérieur qui doivent être déplacées vers le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées vers le compte promu ; les clés de politique/livraison partagées restent à la racine
  du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple intégré actuel. Si exactement un compte Matrix nommé
existe déjà, ou si `defaultAccount` pointe vers une clé non canonique existante
comme `Ops`, la promotion conserve ce compte au lieu de créer une nouvelle
entrée `accounts.default`.

## Schéma de config

La config du Plugin est validée par rapport au schéma JSON Schema dans votre manifeste. Les utilisateurs
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

Votre Plugin reçoit cette config dans `api.pluginConfig` pendant l’enregistrement.

Pour la config spécifique au canal, utilisez plutôt la section de config du canal :

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

Utilisez `buildChannelConfigSchema` pour convertir un schéma Zod en
enveloppe `ChannelConfigSchema` utilisée par les artefacts de config détenus par le Plugin :

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Pour les Plugins tiers, le contrat sur chemin froid reste le manifeste du Plugin :
répliquez le JSON Schema généré dans `openclaw.plugin.json#channelConfigs` afin que le
schéma de config, la configuration et les surfaces d’interface puissent inspecter `channels.<id>` sans
charger de code runtime.

## Assistants de configuration

Les Plugins de canal peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`.
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
Consultez les packages de Plugin intégrés (par exemple le Plugin Discord `src/channel.setup.ts`) pour des
exemples complets.

Pour les invites de liste d’autorisation de messages privés qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration partagés
de `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et d’éventuelles
lignes supplémentaires, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de réécrire le même objet `status` dans
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
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une seule moitié de
cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue en mode fermé lors des écritures réelles de config. Ils
réutilisent un message unique d’installation requise dans `validateInput`,
`applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est
défini.

Pour les interfaces de configuration basées sur des binaires, préférez les assistants délégués partagés au lieu de
copier la même logique binaire/état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés,
  les indications, les scores et la détection de binaire
- `createCliPathTextInput(...)` pour les entrées de texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit déléguer paresseusement
  vers un assistant complet plus lourd
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin que de
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

Il n’existe pas d’équivalent de forçage `npm:`. Utilisez la spécification normale du package npm lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des Plugins intégrés et ils seront automatiquement
découverts pendant la compilation.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations issues de npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (sans scripts de cycle de vie). Conservez des arbres de dépendances de Plugin
  purs JS/TS et évitez les packages qui nécessitent des compilations `postinstall`.
</Info>

Les Plugins intégrés détenus par OpenClaw sont la seule exception à la réparation au démarrage : lorsqu’une
installation packagée en voit un activé par la config du Plugin, l’ancienne config de canal, ou
son manifeste intégré activé par défaut, le démarrage installe les dépendances runtime manquantes de ce Plugin
avant l’importation. Les Plugins tiers ne doivent pas compter sur les installations au démarrage ; continuez d’utiliser l’installateur explicite de Plugin.

## Liens connexes

- [Points d’entrée SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste du Plugin](/fr/plugins/manifest) — référence complète du schéma de manifeste
- [Création de Plugins](/fr/plugins/building-plugins) — guide de prise en main pas à pas
