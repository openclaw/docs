---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre la différence entre setup-entry.ts et index.ts
    - Vous définissez des schémas de configuration de Plugin ou les métadonnées openclaw de package.json
sidebarTitle: Setup and config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées de package.json
title: Installation et configuration du Plugin
x-i18n:
    generated_at: "2026-05-02T21:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Référence pour le packaging des plugins (métadonnées `package.json`), les manifestes (`openclaw.plugin.json`), les entrées de configuration et les schémas de configuration.

<Tip>
**Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging en contexte : [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` a besoin d’un champ `openclaw` qui indique au système de plugins ce que votre plugin fournit :

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
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin de fournisseur / base ClawHub">
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
  Entrée légère réservée à la configuration (facultative).
</ParamField>
<ParamField path="channel" type="object">
  Métadonnées du catalogue de canaux pour les surfaces de configuration, de sélection, de démarrage rapide et d’état.
</ParamField>
<ParamField path="providers" type="string[]">
  ID de fournisseurs enregistrés par ce plugin.
</ParamField>
<ParamField path="install" type="object">
  Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Indicateurs de comportement au démarrage.
</ParamField>

### `openclaw.channel`

`openclaw.channel` est une métadonnée de package légère pour la découverte des canaux et les surfaces de configuration avant le chargement de l’environnement d’exécution.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canonique du canal.                                                         |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé de sélection/configuration lorsqu’il doit différer de `label`.         |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour les catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.       |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’ID du canal. |
| `blurb`                                | `string`   | Brève description d’intégration/de catalogue.                                  |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                 |
| `preferOver`                           | `string[]` | ID de plugins/canaux de priorité inférieure que ce canal doit devancer.        |
| `systemImage`                          | `string`   | Nom facultatif d’icône/image système pour les catalogues d’interface de canal. |
| `selectionDocsPrefix`                  | `string`   | Texte de préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour la configuration, les listes configurées et les surfaces de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Intègre ce canal au flux de configuration standard `allowFrom` du démarrage rapide. |
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

- `configured` : inclure le canal dans les surfaces de liste configurées/de type état
- `setup` : inclure le canal dans les sélecteurs interactifs de configuration
- `docs` : marquer le canal comme public dans les surfaces de documentation/navigation

<Note>
`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` est une métadonnée de package, pas une métadonnée de manifeste.

| Champ                        | Type                                | Signification                                                                   |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spécification ClawHub canonique pour les flux d’installation/mise à jour et d’installation à la demande lors de l’intégration. |
| `npmSpec`                    | `string`                            | Spécification npm canonique pour les flux de repli d’installation/mise à jour. |
| `localPath`                  | `string`                            | Chemin d’installation local de développement ou groupé.                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Source d’installation préférée lorsque plusieurs sources sont disponibles.      |
| `minHostVersion`             | `string`                            | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z` ou `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chaîne d’intégrité npm dist attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permet aux flux de réinstallation de plugins groupés de récupérer certaines défaillances de configuration obsolète. |

<AccordionGroup>
  <Accordion title="Comportement d’intégration">
    L’intégration interactive utilise aussi `openclaw.install` pour les surfaces d’installation à la demande. Si votre plugin expose des choix d’authentification de fournisseur ou des métadonnées de configuration/catalogue de canal avant le chargement de l’environnement d’exécution, l’intégration peut afficher ce choix, demander une installation ClawHub, npm ou locale, installer ou activer le plugin, puis poursuivre le flux sélectionné. Les choix d’intégration ClawHub utilisent `clawhubSpec` et sont préférés lorsqu’ils sont présents ; les choix npm nécessitent des métadonnées de catalogue approuvées avec un `npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épingles npm facultatives. Si `expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent pour npm. Conservez les métadonnées « quoi afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer » dans `package.json`.
  </Accordion>
  <Accordion title="Application de minHostVersion">
    Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes non groupé l’appliquent tous deux. Les hôtes plus anciens ignorent les plugins externes ; les chaînes de version invalides sont rejetées. Les plugins source groupés sont supposés être co-versionnés avec le checkout hôte.
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
    `allowInvalidConfigRecovery` n’est pas un contournement général pour les configurations cassées. Il est réservé à une récupération étroite de plugins groupés, afin que la réinstallation/configuration puisse réparer des restes de mise à niveau connus comme un chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même plugin. Si la configuration est cassée pour des raisons sans rapport, l’installation échoue toujours fermée et demande à l’opérateur d’exécuter `openclaw doctor --fix`.
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

Lorsque cette option est activée, OpenClaw ne charge que `setupEntry` pendant la phase de démarrage précédant l’écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que le Gateway commence à écouter.

<Warning>
N’activez le chargement différé que lorsque votre `setupEntry` enregistre tout ce dont le Gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP, méthodes du Gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si votre entrée de configuration/complète enregistre des méthodes RPC du Gateway, gardez-les sur un préfixe propre au plugin. Les espaces de noms d’administration principaux réservés (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent détenus par le cœur et se résolvent toujours en `operator.admin`.

## Manifeste de Plugin

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

Consultez [Manifeste de Plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication sur ClawHub

Pour les packages de plugins, utilisez la commande ClawHub propre au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’ancien alias de publication réservé aux skills concerne les skills. Les packages de Plugin doivent toujours utiliser `clawhub package publish`.
</Note>

## Entrée de configuration

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` qu’OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration (onboarding, réparation de configuration, inspection des canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques de chiffrement, enregistrements CLI, services en arrière-plan) pendant les flux de configuration.

Les canaux d’espace de travail intégrés qui conservent des exports sûrs pour la configuration dans des modules annexes peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` au lieu de `defineSetupPluginEntry(...)`. Ce contrat intégré prend aussi en charge un export `runtime` facultatif afin que le câblage d’exécution au moment de la configuration reste léger et explicite.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Le canal est désactivé mais nécessite des surfaces de configuration/onboarding.
    - Le canal est activé mais non configuré.
    - Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - L’objet Plugin du canal (via `defineSetupPluginEntry`).
    - Toutes les routes HTTP requises avant l’écoute du Gateway.
    - Toutes les méthodes du Gateway nécessaires au démarrage.

    Ces méthodes du Gateway au démarrage doivent tout de même éviter les espaces de noms d’administration réservés au cœur, tels que `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Les enregistrements CLI.
    - Les services en arrière-plan.
    - Les imports d’exécution lourds (chiffrement, SDK).
    - Les méthodes du Gateway uniquement nécessaires après le démarrage.

  </Accordion>
</AccordionGroup>

### Imports étroits d’assistants de configuration

Pour les chemins chauds réservés à la configuration, privilégiez les coutures étroites d’assistants de configuration plutôt que le parapluie plus large `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’import                    | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants d’exécution au moment de la configuration qui restent disponibles dans `setupEntry` / le démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de comptes sensibles à l’environnement                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/docs de configuration/installation                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Utilisez la couture plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils partagée complète de configuration, y compris les assistants de correctifs de configuration comme `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de correctifs de configuration restent sûrs à l’import pour les chemins chauds. Leur recherche de surface de contrat intégrée pour la promotion de compte unique est paresseuse, donc importer `plugin-sdk/setup-runtime` ne charge pas immédiatement la découverte de surface de contrat intégrée avant que l’adaptateur soit réellement utilisé.

### Promotion de compte unique détenue par le canal

Lorsqu’un canal migre d’une configuration de premier niveau à compte unique vers `channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues ayant une portée de compte dans `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de configuration :

- `singleAccountKeysToMove` : clés de premier niveau supplémentaires qui doivent être déplacées dans le compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces clés sont déplacées dans le compte promu ; les clés partagées de stratégie/livraison restent à la racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisir quel compte existant reçoit les valeurs promues

<Note>
Matrix est l’exemple intégré actuel. S’il existe déjà exactement un compte Matrix nommé, ou si `defaultAccount` pointe vers une clé non canonique existante telle que `Ops`, la promotion préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`.
</Note>

## Schéma de configuration

La configuration du Plugin est validée par rapport au JSON Schema dans votre manifeste. Les utilisateurs configurent les plugins via :

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

Pour une configuration propre à un canal, utilisez plutôt la section de configuration du canal :

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

Utilisez `buildChannelConfigSchema` pour convertir un schéma Zod en enveloppe `ChannelConfigSchema` utilisée par les artefacts de configuration détenus par le Plugin :

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

Si vous rédigez déjà le contrat en JSON Schema ou TypeBox, utilisez l’assistant direct afin qu’OpenClaw puisse éviter la conversion Zod vers JSON Schema sur les chemins de métadonnées :

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Pour les plugins tiers, le contrat de chemin froid reste le manifeste du Plugin : reflétez le JSON Schema généré dans `openclaw.plugin.json#channelConfigs` afin que le schéma de configuration, la configuration et les surfaces UI puissent inspecter `channels.<id>` sans charger de code d’exécution.

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

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et plus encore. Consultez les packages de plugins intégrés (par exemple le Plugin Discord `src/channel.setup.ts`) pour des exemples complets.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Pour les invites de liste d’autorisation DM qui n’ont besoin que du flux standard `note -> prompt -> parse -> merge -> patch`, privilégiez les assistants de configuration partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, et `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et des lignes supplémentaires facultatives, privilégiez `createStandardChannelSetupStatus(...)` depuis `openclaw/plugin-sdk/setup` au lieu de recréer manuellement le même objet `status` dans chaque Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
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

    L’adaptateur/l’assistant facultatif généré échoue fermé lors des écritures de configuration réelles. Ils réutilisent un seul message d’installation requise sur `validateInput`, `applyAccountConfig`, et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est défini.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Pour les UI de configuration adossées à un binaire, privilégiez les assistants délégués partagés au lieu de copier le même collage binaire/état dans chaque canal :

    - `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés, les indications, les scores et la détection de binaire
    - `createCliPathTextInput(...)` pour les entrées texte adossées à un chemin
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer paresseusement vers un assistant complet plus lourd
    - `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin de déléguer qu’une décision `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub), puis installez :

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Les spécifications de package nues s’installent depuis npm pendant la transition de lancement.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Utilisez npm lorsqu’un package n’a pas encore été déplacé vers ClawHub, ou lorsque vous avez besoin d’un
    chemin d’installation npm direct pendant la migration :

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dans le dépôt :** placez-les sous l’arborescence de l’espace de travail des plugins groupés ; ils sont automatiquement découverts pendant la compilation.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
Pour les installations provenant de npm, `openclaw plugins install` installe le package sous `~/.openclaw/npm` avec les scripts de cycle de vie désactivés. Gardez les arbres de dépendances des plugins en JS/TS pur et évitez les packages qui nécessitent des compilations `postinstall`.
</Info>

<Note>
Le démarrage du Gateway n’installe pas les dépendances des plugins. Les flux d’installation npm/git/ClawHub sont responsables de la convergence des dépendances ; les plugins locaux doivent déjà avoir leurs dépendances installées.
</Note>

Les métadonnées des packages groupés sont explicites, elles ne sont pas déduites du JavaScript compilé au démarrage du gateway. Les dépendances d’exécution appartiennent au package de plugin qui les possède ; le démarrage d’OpenClaw packagé ne répare ni ne réplique jamais les dépendances des plugins.

## Associés

- [Créer des plugins](/fr/plugins/building-plugins) — guide de démarrage étape par étape
- [Manifeste de plugin](/fr/plugins/manifest) — référence complète du schéma de manifeste
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
