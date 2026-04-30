---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre la différence entre setup-entry.ts et index.ts
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées openclaw dans package.json
sidebarTitle: Setup and config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées de package.json
title: Installation et configuration du Plugin
x-i18n:
    generated_at: "2026-04-30T07:41:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Référence pour l’empaquetage des plugins (métadonnées `package.json`), les manifestes (`openclaw.plugin.json`), les entrées de configuration initiale et les schémas de configuration.

<Tip>
**Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent l’empaquetage en contexte : [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` nécessite un champ `openclaw` qui indique au système de plugins ce que votre plugin fournit :

<Tabs>
  <Tab title="Channel plugin">
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
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
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
Si vous publiez le plugin en externe sur ClawHub, ces champs `compat` et `build` sont obligatoires. Les extraits de publication canoniques se trouvent dans `docs/snippets/plugin-publish/`.
</Note>

### Champs `openclaw`

<ParamField path="extensions" type="string[]">
  Fichiers de point d’entrée (relatifs à la racine du package).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrée légère dédiée à la configuration initiale (facultatif).
</ParamField>
<ParamField path="channel" type="object">
  Métadonnées de catalogue de canal pour les surfaces de configuration initiale, de sélecteur, de démarrage rapide et d’état.
</ParamField>
<ParamField path="providers" type="string[]">
  Identifiants de fournisseurs enregistrés par ce plugin.
</ParamField>
<ParamField path="install" type="object">
  Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Indicateurs de comportement au démarrage.
</ParamField>

### `openclaw.channel`

`openclaw.channel` correspond à des métadonnées de package légères pour la découverte de canaux et les surfaces de configuration initiale avant le chargement à l’exécution.

| Champ                                  | Type       | Signification                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identifiant canonique du canal.                                               |
| `label`                                | `string`   | Libellé principal du canal.                                                   |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/de la configuration initiale lorsqu’il doit différer de `label`. |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour les catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration initiale et de sélection. |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Courte description d’intégration/de catalogue.                                |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                   |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection de canal.                |
| `preferOver`                           | `string[]` | Identifiants de plugin/canal de priorité inférieure que ce canal doit devancer. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/d’image système pour les catalogues d’interface de canal. |
| `selectionDocsPrefix`                  | `string`   | Texte de préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Afficher directement le chemin de documentation au lieu d’un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées au texte de sélection.               |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de mise en forme sortante. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de configuration initiale, listes configurées et documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Inclut ce canal dans le flux standard de configuration initiale de démarrage rapide `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Exiger une liaison de compte explicite même lorsqu’un seul compte existe.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préférer la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

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

- `configured` : inclure le canal dans les surfaces de liste de type configuration/état
- `setup` : inclure le canal dans les sélecteurs interactifs de configuration initiale/configuration
- `docs` : marquer le canal comme public dans les surfaces de documentation/navigation

<Note>
`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` correspond à des métadonnées de package, pas à des métadonnées de manifeste.

| Champ                        | Type                 | Signification                                                                  |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.          |
| `localPath`                  | `string`             | Chemin local de développement ou d’installation groupée.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.              |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.           |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité npm dist attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de plugins groupés de récupérer après des échecs précis dus à une configuration obsolète. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    L’intégration interactive utilise aussi `openclaw.install` pour les surfaces d’installation à la demande. Si votre plugin expose des choix d’authentification de fournisseur ou des métadonnées de configuration initiale/catalogue de canal avant le chargement à l’exécution, l’intégration peut afficher ce choix, demander une installation npm ou locale, installer ou activer le plugin, puis poursuivre le flux sélectionné. Les choix d’intégration npm nécessitent des métadonnées de catalogue fiables avec un `npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épinglages facultatifs. Si `expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent. Conservez les métadonnées « quoi afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer » dans `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent tous deux. Les hôtes plus anciens ignorent le plugin ; les chaînes de version invalides sont rejetées.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` n’est pas un contournement général pour les configurations cassées. Il est réservé à une récupération étroite des plugins groupés, afin que la réinstallation/configuration initiale puisse corriger des restes de mise à niveau connus, comme un chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même plugin. Si la configuration est cassée pour des raisons sans rapport, l’installation échoue toujours de manière fermée et indique à l’opérateur d’exécuter `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

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

Lorsque cette option est activée, OpenClaw charge uniquement `setupEntry` pendant la phase de démarrage avant écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que le gateway commence à écouter.

<Warning>
N’activez le chargement différé que lorsque votre `setupEntry` enregistre tout ce dont le gateway a besoin avant de commencer à écouter (enregistrement de canal, routes HTTP, méthodes de gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si votre entrée de configuration initiale/complète enregistre des méthodes RPC de gateway, conservez-les sous un préfixe propre au plugin. Les espaces de noms d’administration principaux réservés (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent détenus par le cœur et se résolvent toujours en `operator.admin`.

## Manifeste de plugin

Chaque plugin natif doit fournir un `openclaw.plugin.json` à la racine du package. OpenClaw l’utilise pour valider la configuration sans exécuter le code du plugin.

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

Consultez [Manifeste de plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de plugin, utilisez la commande ClawHub propre au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’ancien alias de publication réservé aux skills est destiné aux Skills. Les packages de plugin doivent toujours utiliser `clawhub package publish`.
</Note>

## Entrée de configuration initiale

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` qu’OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration initiale (intégration, réparation de configuration, inspection de canal désactivé).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques de chiffrement, enregistrements CLI, services d’arrière-plan) pendant les flux de configuration.

Les canaux regroupés de l’espace de travail qui conservent des exports sûrs pour la configuration dans des modules sidecar peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` au lieu de `defineSetupPluginEntry(...)`. Ce contrat regroupé prend aussi en charge un export `runtime` facultatif afin que le câblage d’exécution au moment de la configuration reste léger et explicite.

<AccordionGroup>
  <Accordion title="Quand OpenClaw utilise setupEntry au lieu de l’entrée complète">
    - Le canal est désactivé mais a besoin de surfaces de configuration/d’intégration.
    - Le canal est activé mais non configuré.
    - Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Ce que setupEntry doit enregistrer">
    - L’objet plugin de canal (via `defineSetupPluginEntry`).
    - Toutes les routes HTTP requises avant l’écoute du gateway.
    - Toutes les méthodes du gateway nécessaires au démarrage.

    Ces méthodes de gateway au démarrage doivent tout de même éviter les espaces de noms d’administration réservés au cœur, comme `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="Ce que setupEntry ne doit PAS inclure">
    - Des enregistrements CLI.
    - Des services d’arrière-plan.
    - Des imports d’exécution lourds (chiffrement, SDK).
    - Des méthodes du gateway nécessaires uniquement après le démarrage.

  </Accordion>
</AccordionGroup>

### Imports d’assistants de configuration ciblés

Pour les chemins critiques réservés à la configuration, préférez les surfaces d’assistance de configuration ciblées au regroupement plus large `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’importation               | À utiliser pour                                                                           | Exports clés                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants d’exécution au moment de la configuration qui restent disponibles dans `setupEntry` / démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de compte sensibles à l’environnement                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/docs pour la configuration/l’installation                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Utilisez la surface plus large `plugin-sdk/setup` lorsque vous voulez toute la boîte à outils de configuration partagée, y compris les assistants de correctif de configuration comme `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de correctif de configuration restent sûrs à importer sur les chemins critiques. Leur recherche de surface de contrat regroupée pour la promotion d’un compte unique est paresseuse, donc importer `plugin-sdk/setup-runtime` ne charge pas avidement la découverte de surface de contrat regroupée avant que l’adaptateur soit réellement utilisé.

### Promotion d’un compte unique détenue par le canal

Lorsqu’un canal passe d’une configuration de premier niveau à compte unique à `channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues à portée de compte dans `accounts.default`.

Les canaux regroupés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de configuration :

- `singleAccountKeysToMove` : clés de premier niveau supplémentaires qui doivent être déplacées dans le compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces clés sont déplacées dans le compte promu ; les clés de stratégie/livraison partagées restent à la racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisir quel compte existant reçoit les valeurs promues

<Note>
Matrix est l’exemple regroupé actuel. S’il existe déjà exactement un compte Matrix nommé, ou si `defaultAccount` pointe vers une clé non canonique existante comme `Ops`, la promotion préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`.
</Note>

## Schéma de configuration

La configuration du plugin est validée par rapport au JSON Schema dans votre manifeste. Les utilisateurs configurent les plugins via :

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

Votre plugin reçoit cette configuration sous la forme `api.pluginConfig` pendant l’enregistrement.

Pour la configuration propre à un canal, utilisez plutôt la section de configuration du canal :

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

### Création de schémas de configuration de canal

Utilisez `buildChannelConfigSchema` pour convertir un schéma Zod en enveloppe `ChannelConfigSchema` utilisée par les artefacts de configuration détenus par les plugins :

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

Pour les plugins tiers, le contrat de chemin froid reste le manifeste du plugin : recopiez le JSON Schema généré dans `openclaw.plugin.json#channelConfigs` afin que le schéma de configuration, la configuration et les surfaces d’interface utilisateur puissent inspecter `channels.<id>` sans charger de code d’exécution.

## Assistants de configuration

Les plugins de canal peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`. L’assistant est un objet `ChannelSetupWizard` sur le `ChannelPlugin` :

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

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et plus encore. Consultez les packages de plugins regroupés (par exemple le plugin Discord `src/channel.setup.ts`) pour des exemples complets.

<AccordionGroup>
  <Accordion title="Invites allowFrom partagées">
    Pour les invites de liste d’autorisation DM qui n’ont besoin que du flux standard `note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, et `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="État standard de configuration de canal">
    Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et des lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis `openclaw/plugin-sdk/setup` au lieu de recréer manuellement le même objet `status` dans chaque plugin.
  </Accordion>
  <Accordion title="Surface facultative de configuration de canal">
    Pour les surfaces de configuration facultatives qui ne doivent apparaître que dans certains contextes, utilisez `createOptionalChannelSetupSurface` depuis `openclaw/plugin-sdk/channel-setup` :

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

    `plugin-sdk/channel-setup` expose aussi les constructeurs de plus bas niveau `createOptionalChannelSetupAdapter(...)` et `createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié de cette surface d’installation facultative.

    L’adaptateur/l’assistant facultatif généré échoue de façon fermée lors des écritures réelles de configuration. Ils réutilisent un même message d’installation requise dans `validateInput`, `applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est défini.

  </Accordion>
  <Accordion title="Assistants de configuration adossés à un binaire">
    Pour les interfaces utilisateur de configuration adossées à un binaire, préférez les assistants délégués partagés au lieu de copier le même câblage binaire/état dans chaque canal :

    - `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés, les indications, les scores et la détection du binaire
    - `createCliPathTextInput(...)` pour les entrées texte adossées à un chemin
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer paresseusement vers un assistant complet plus lourd
    - `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` doit seulement déléguer une décision `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub), puis installez :

<Tabs>
  <Tab title="Auto (ClawHub puis npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw essaie d’abord ClawHub et bascule automatiquement sur npm.

  </Tab>
  <Tab title="ClawHub uniquement">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spécification de package npm">
    Utilisez npm lorsqu’un package n’a pas encore été déplacé vers ClawHub, ou lorsque vous avez besoin d’un
    chemin d’installation npm direct pendant la migration :

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins regroupés et ils seront automatiquement découverts pendant la construction.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
Pour les installations provenant de npm, `openclaw plugins install` exécute `npm install --ignore-scripts` local au projet (sans scripts de cycle de vie), en ignorant les paramètres d’installation npm globaux hérités. Gardez les arbres de dépendances des plugins en JS/TS pur et évitez les packages qui nécessitent des constructions `postinstall`.
</Info>

<Note>
Les plugins intégrés appartenant à OpenClaw sont la seule exception de réparation au démarrage : lorsqu’une installation packagée en voit un activé par la configuration du plugin, une configuration de canal héritée ou son manifeste intégré activé par défaut, le démarrage installe les dépendances d’exécution manquantes de ce plugin avant l’importation. Les opérateurs peuvent inspecter ou réparer cette étape avec `openclaw plugins deps`. Les plugins tiers ne doivent pas dépendre des installations au démarrage ; continuez à utiliser le programme d’installation explicite des plugins.
</Note>

Les dépendances d’exécution intégrées au niveau du package sont des métadonnées explicites, et non déduites du JavaScript généré au démarrage du Gateway. Si une dépendance racine partagée d’OpenClaw doit être disponible dans le miroir d’exécution externe du plugin intégré, déclarez-la dans `openclaw.bundle.mirroredRootRuntimeDependencies` dans le manifeste du package racine.

## Liens associés

- [Créer des plugins](/fr/plugins/building-plugins) — guide de démarrage pas à pas
- [Manifeste de Plugin](/fr/plugins/manifest) — référence complète du schéma du manifeste
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
