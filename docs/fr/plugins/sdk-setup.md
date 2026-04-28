---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre `setup-entry.ts` vs `index.ts`
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées `openclaw` dans `package.json`
sidebarTitle: Setup and config
summary: Assistants de configuration, `setup-entry.ts`, schémas de configuration, et métadonnées `package.json`
title: Configuration et config des Plugins
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:36:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Référence pour le packaging des Plugins (métadonnées `package.json`), les manifestes (`openclaw.plugin.json`), les entrées de setup, et les schémas de configuration.

<Tip>
**Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte : [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et [Plugins fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de Plugins ce que votre Plugin fournit :

<Tabs>
  <Tab title="Plugin de canal">
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
          "blurb": "Brève description du canal."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin fournisseur / base ClawHub">
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
  </Tab>
</Tabs>

<Note>
Si vous publiez le Plugin en externe sur ClawHub, les champs `compat` et `build` sont requis. Les extraits de publication canoniques se trouvent dans `docs/snippets/plugin-publish/`.
</Note>

### Champs `openclaw`

<ParamField path="extensions" type="string[]">
  Fichiers de point d’entrée (relatifs à la racine du package).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrée légère réservée au setup (facultative).
</ParamField>
<ParamField path="channel" type="object">
  Métadonnées du catalogue de canaux pour les surfaces de setup, sélecteur, quickstart, et statut.
</ParamField>
<ParamField path="providers" type="string[]">
  Ids de fournisseur enregistrés par ce Plugin.
</ParamField>
<ParamField path="install" type="object">
  Indices d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Drapeaux de comportement au démarrage.
</ParamField>

### `openclaw.channel`

`openclaw.channel` est une métadonnée de package légère pour la découverte des canaux et les surfaces de setup avant le chargement du runtime.

| Champ                                  | Type       | Signification                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id canonique du canal.                                                        |
| `label`                                | `string`   | Libellé principal du canal.                                                   |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/setup lorsqu’il doit différer de `label`.                |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour les catalogues de canaux enrichis et les surfaces de statut. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de setup et de sélection.              |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’id du canal. |
| `blurb`                                | `string`   | Courte description de l’intégration guidée/du catalogue.                      |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                   |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                |
| `preferOver`                           | `string[]` | Ids de Plugin/canal de priorité inférieure que ce canal doit surpasser.       |
| `systemImage`                          | `string`   | Nom facultatif d’icône/system-image pour les catalogues UI de canaux.         |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Afficher directement le chemin de documentation au lieu d’un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées au texte de sélection.               |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de setup, listes configurées, et documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Active ce canal dans le flux quickstart standard de setup `allowFrom`.        |
| `forceAccountBinding`                  | `boolean`  | Exiger une liaison de compte explicite même lorsqu’un seul compte existe.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préférer la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

Exemple :

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (auto-hébergé)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Intégration de discussion auto-hébergée basée sur Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide :",
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

- `configured` : inclure le canal dans les surfaces de liste configurée/de type statut
- `setup` : inclure le canal dans les sélecteurs interactifs de setup/configuration
- `docs` : marquer le canal comme visible publiquement dans les surfaces docs/navigation

<Note>
`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` est une métadonnée de package, pas une métadonnée de manifeste.

| Champ                        | Type                 | Signification                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux install/update.                        |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou intégré.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.             |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité dist npm attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de Plugin intégré de récupérer de certains échecs de configuration obsolète. |

<AccordionGroup>
  <Accordion title="Comportement de l’intégration guidée">
    L’intégration guidée interactive utilise aussi `openclaw.install` pour les surfaces d’installation à la demande. Si votre Plugin expose des choix d’authentification fournisseur ou des métadonnées de setup/catalogue de canal avant le chargement du runtime, l’intégration guidée peut afficher ce choix, demander npm vs installation locale, installer ou activer le Plugin, puis poursuivre le flux sélectionné. Les choix d’intégration guidée npm nécessitent des métadonnées de catalogue de confiance avec un `npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épingles facultatives. Si `expectedIntegrity` est présent, les flux install/update l’appliquent. Conservez les métadonnées « quoi afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer » dans `package.json`.
  </Accordion>
  <Accordion title="Application de minHostVersion">
    Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent tous deux. Les hôtes plus anciens ignorent le Plugin ; les chaînes de version invalides sont rejetées.
  </Accordion>
  <Accordion title="Installations npm épinglées">
    Pour les installations npm épinglées, conservez la version exacte dans `npmSpec` et ajoutez l’intégrité attendue de l’artefact :

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

  </Accordion>
  <Accordion title="Portée de allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` n’est pas un contournement général pour les configurations cassées. Il est destiné uniquement à une récupération ciblée des Plugins intégrés, afin que la réinstallation/setup puisse réparer des reliquats connus de mise à niveau comme un chemin de Plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même Plugin. Si la configuration est cassée pour des raisons non liées, l’installation échoue quand même en mode fermé et indique à l’opérateur d’exécuter `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

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

Lorsqu’il est activé, OpenClaw charge uniquement `setupEntry` pendant la phase de démarrage avant écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que la Gateway a commencé à écouter.

<Warning>
N’activez le chargement différé que lorsque votre `setupEntry` enregistre tout ce dont la Gateway a besoin avant qu’elle commence à écouter (enregistrement de canal, routes HTTP, méthodes Gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si votre entrée setup/complète enregistre des méthodes RPC Gateway, conservez-les sous un préfixe spécifique au Plugin. Les espaces de noms admin réservés au noyau (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent possédés par le noyau et se résolvent toujours vers `operator.admin`.

## Manifeste de Plugin

Chaque Plugin natif doit fournir un `openclaw.plugin.json` à la racine du package. OpenClaw l’utilise pour valider la configuration sans exécuter le code du Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Ajoute les capacités My Plugin à OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Secret de vérification Webhook"
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

Voir [Manifeste de Plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de Plugin, utilisez la commande ClawHub spécifique aux packages :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’ancien alias de publication réservé aux Skills concerne les Skills. Les packages de Plugin doivent toujours utiliser `clawhub package publish`.
</Note>

## Entrée de setup

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` qu’OpenClaw charge lorsqu’il n’a besoin que des surfaces de setup (intégration guidée, réparation de configuration, inspection de canal désactivé).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code runtime lourd (bibliothèques de cryptographie, enregistrements CLI, services d’arrière-plan) pendant les flux de setup.

Les canaux intégrés de l’espace de travail qui conservent des exports sûrs pour le setup dans des modules sidecar peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` au lieu de `defineSetupPluginEntry(...)`. Ce contrat intégré prend aussi en charge un export `runtime` facultatif afin que le câblage runtime au moment du setup reste léger et explicite.

<AccordionGroup>
  <Accordion title="Quand OpenClaw utilise setupEntry au lieu de l’entrée complète">
    - Le canal est désactivé mais a besoin des surfaces de setup/intégration guidée.
    - Le canal est activé mais non configuré.
    - Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`).
  </Accordion>
  <Accordion title="Ce que setupEntry doit enregistrer">
    - L’objet Plugin de canal (via `defineSetupPluginEntry`).
    - Toute route HTTP requise avant l’écoute de la Gateway.
    - Toute méthode Gateway nécessaire pendant le démarrage.

    Ces méthodes Gateway de démarrage doivent toujours éviter les espaces de noms admin réservés au noyau tels que `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="Ce que setupEntry ne doit PAS inclure">
    - Enregistrements CLI.
    - Services d’arrière-plan.
    - Imports runtime lourds (crypto, SDK).
    - Méthodes Gateway nécessaires uniquement après le démarrage.
  </Accordion>
</AccordionGroup>

### Imports d’aides de setup ciblés

Pour les chemins setup-only chauds, préférez les coutures ciblées d’aides de setup plutôt que l’ombrelle plus large `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de setup :

| Chemin d’import                    | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | aides runtime au moment du setup qui restent disponibles dans `setupEntry` / démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de setup de compte conscients de l’environnement                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                     |
| `plugin-sdk/setup-tools`           | aides setup/install CLI/archive/docs                                                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                           |

Utilisez la couture plus large `plugin-sdk/setup` lorsque vous voulez toute la boîte à outils partagée de setup, y compris des aides de patch de configuration telles que `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch de setup restent sûrs à l’import pour le chemin chaud. Leur recherche de surface de contrat de promotion mono-compte intégrée est lazy, donc l’import de `plugin-sdk/setup-runtime` ne charge pas de manière anticipée la découverte de surface de contrat intégrée avant l’utilisation réelle de l’adaptateur.

### Promotion mono-compte possédée par le canal

Lorsqu’un canal passe d’une configuration de niveau supérieur mono-compte à `channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues de portée compte vers `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de setup :

- `singleAccountKeysToMove` : clés supplémentaires de niveau supérieur à déplacer dans le compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces clés sont déplacées dans le compte promu ; les clés partagées de politique/livraison restent à la racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisir quel compte existant reçoit les valeurs promues

<Note>
Matrix est l’exemple intégré actuel. Si exactement un compte Matrix nommé existe déjà, ou si `defaultAccount` pointe vers une clé non canonique existante telle que `Ops`, la promotion conserve ce compte au lieu de créer une nouvelle entrée `accounts.default`.
</Note>

## Schéma de configuration

La configuration du Plugin est validée par rapport au schéma JSON de votre manifeste. Les utilisateurs configurent les Plugins via :

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

Utilisez `buildChannelConfigSchema` pour convertir un schéma Zod en wrapper `ChannelConfigSchema` utilisé par les artefacts de configuration possédés par le Plugin :

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

Pour les Plugins tiers, le contrat de chemin à froid reste le manifeste de Plugin : recopiez le schéma JSON généré dans `openclaw.plugin.json#channelConfigs` afin que le schéma de configuration, le setup, et les surfaces UI puissent inspecter `channels.<id>` sans charger le code runtime.

## Assistants de setup

Les Plugins de canal peuvent fournir des assistants de setup interactifs pour `openclaw onboard`. L’assistant est un objet `ChannelSetupWizard` sur le `ChannelPlugin` :

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connecté",
    unconfiguredLabel: "Non configuré",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token du bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Utiliser MY_CHANNEL_BOT_TOKEN depuis l’environnement ?",
      keepPrompt: "Conserver le token actuel ?",
      inputPrompt: "Saisissez votre token de bot :",
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

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et davantage. Voir les packages de Plugins intégrés (par exemple le plugin Discord `src/channel.setup.ts`) pour des exemples complets.

<AccordionGroup>
  <Accordion title="Prompts allowFrom partagés">
    Pour les prompts de liste d’autorisation DM qui n’ont besoin que du flux standard `note -> prompt -> parse -> merge -> patch`, préférez les aides partagées de setup depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, et `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Statut standard de setup de canal">
    Pour les blocs de statut de setup de canal qui ne varient que par les libellés, scores, et lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis `openclaw/plugin-sdk/setup` au lieu de réécrire à la main le même objet `status` dans chaque Plugin.
  </Accordion>
  <Accordion title="Surface facultative de setup de canal">
    Pour les surfaces de setup facultatives qui ne doivent apparaître que dans certains contextes, utilisez `createOptionalChannelSetupSurface` depuis `openclaw/plugin-sdk/channel-setup` :

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Renvoie { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` expose aussi les builders de plus bas niveau `createOptionalChannelSetupAdapter(...)` et `createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié de cette surface d’installation facultative.

    L’adaptateur/l’assistant facultatif généré échoue en mode fermé sur les vraies écritures de configuration. Ils réutilisent un même message « installation requise » dans `validateInput`, `applyAccountConfig`, et `finalize`, et ajoutent un lien de documentation lorsque `docsPath` est défini.

  </Accordion>
  <Accordion title="Aides de setup adossées à des binaires">
    Pour les UI de setup adossées à des binaires, préférez les aides déléguées partagées au lieu de recopier la même glue binaire/statut dans chaque canal :

    - `createDetectedBinaryStatus(...)` pour les blocs de statut qui ne varient que par les libellés, indices, scores, et détection binaire
    - `createCliPathTextInput(...)` pour les champs texte adossés à un chemin
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer de manière lazy vers un assistant complet plus lourd
    - `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` ne doit déléguer qu’une décision `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou npm, puis installez :

<Tabs>
  <Tab title="Auto (ClawHub puis npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw essaie d’abord ClawHub puis revient automatiquement à npm.

  </Tab>
  <Tab title="ClawHub uniquement">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spécification de package npm">
    Il n’existe pas de remplacement `npm:` correspondant. Utilisez la spécification normale du package npm lorsque vous voulez le chemin npm après le repli ClawHub :

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des Plugins intégrés et ils seront automatiquement découverts pendant la construction.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
Pour les installations provenant de npm, `openclaw plugins install` exécute un `npm install --ignore-scripts` local au projet (sans scripts de cycle de vie), en ignorant les réglages hérités d’installation globale npm. Gardez les arbres de dépendances des Plugins en pur JS/TS et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

<Note>
Les Plugins intégrés appartenant à OpenClaw sont la seule exception pour la réparation au démarrage : lorsqu’une installation packagée en voit un activé par la configuration du Plugin, l’ancienne configuration de canal, ou son manifeste intégré activé par défaut, le démarrage installe les dépendances d’exécution manquantes de ce Plugin avant l’import. Les Plugins tiers ne doivent pas compter sur des installations au démarrage ; continuez à utiliser l’installateur explicite de Plugins.
</Note>

## Associé

- [Construire des Plugins](/fr/plugins/building-plugins) — guide pas à pas pour démarrer
- [Manifeste de Plugin](/fr/plugins/manifest) — référence complète du schéma de manifeste
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
