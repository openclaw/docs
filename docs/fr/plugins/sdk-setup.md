---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre la différence entre setup-entry.ts et index.ts
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées openclaw dans package.json
sidebarTitle: Setup and config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées package.json
title: Installation et configuration du Plugin
x-i18n:
    generated_at: "2026-07-04T15:15:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Référence pour le packaging de Plugin (métadonnées `package.json`), les manifestes (`openclaw.plugin.json`), les entrées de configuration initiale et les schémas de configuration.

<Tip>
**Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging en contexte : [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et [Plugins fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées de package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de Plugins ce que fournit votre Plugin :

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
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
Si vous publiez le Plugin en externe sur ClawHub, ces champs `compat` et `build` sont obligatoires. Les extraits de publication canoniques se trouvent dans `docs/snippets/plugin-publish/`.
</Note>

### Champs `openclaw`

<ParamField path="extensions" type="string[]">
  Fichiers de point d’entrée (relatifs à la racine du package).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrée légère réservée à la configuration initiale (facultative).
</ParamField>
<ParamField path="channel" type="object">
  Métadonnées du catalogue de canaux pour les surfaces de configuration initiale, de sélection, de démarrage rapide et d’état.
</ParamField>
<ParamField path="providers" type="string[]">
  Identifiants de fournisseurs enregistrés par ce Plugin.
</ParamField>
<ParamField path="install" type="object">
  Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Indicateurs de comportement au démarrage.
</ParamField>

### `openclaw.channel`

`openclaw.channel` correspond à des métadonnées de package peu coûteuses pour la découverte des canaux et les surfaces de configuration initiale avant le chargement du runtime.

| Champ                                  | Type       | Signification                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identifiant canonique du canal.                                               |
| `label`                                | `string`   | Libellé principal du canal.                                                   |
| `selectionLabel`                       | `string`   | Libellé de sélection/configuration initiale lorsqu’il doit différer de `label`. |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration initiale et de sélection. |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Brève description d’onboarding/de catalogue.                                  |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                   |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                |
| `preferOver`                           | `string[]` | Identifiants de Plugin/canal de priorité inférieure que ce canal doit devancer. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/image système pour les catalogues d’interface de canaux. |
| `selectionDocsPrefix`                  | `string`   | Texte de préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées au texte de sélection.               |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de mise en forme sortante. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour la configuration initiale, les listes configurées et les surfaces de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Active ce canal dans le flux standard de démarrage rapide `allowFrom`.        |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison explicite du compte même lorsqu’un seul compte existe.      |
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
- `setup` : inclure le canal dans les sélecteurs interactifs de configuration initiale/configuration
- `docs` : marquer le canal comme public dans les surfaces de documentation/navigation

<Note>
`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` correspond à des métadonnées de package, pas à des métadonnées de manifeste.

| Champ                        | Type                                | Signification                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spécification ClawHub canonique pour les flux d’installation/mise à jour et d’installation à la demande lors de l’onboarding. |
| `npmSpec`                    | `string`                            | Spécification npm canonique pour les flux de secours d’installation/mise à jour. |
| `localPath`                  | `string`                            | Chemin d’installation local de développement ou groupé.                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Source d’installation préférée lorsque plusieurs sources sont disponibles.       |
| `minHostVersion`             | `string`                            | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z` ou `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | Chaîne d’intégrité npm dist attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permet aux flux de réinstallation de Plugins groupés de récupérer après certaines défaillances de configuration obsolète. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm propres à la plateforme requis et vérifiés pendant l’installation npm. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    L’onboarding interactif utilise également `openclaw.install` pour les surfaces d’installation à la demande. Si votre Plugin expose des choix d’authentification fournisseur ou des métadonnées de configuration initiale/catalogue de canal avant le chargement du runtime, l’onboarding peut afficher ce choix, demander une installation via ClawHub, npm ou locale, installer ou activer le Plugin, puis poursuivre le flux sélectionné. Les choix d’onboarding ClawHub utilisent `clawhubSpec` et sont préférés lorsqu’ils sont présents ; les choix npm nécessitent des métadonnées de catalogue approuvées avec un `npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épinglages npm facultatifs. Si `expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent pour npm. Conservez les métadonnées « quoi afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer » dans `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Si `minHostVersion` est défini, l’installation et le chargement non groupé depuis le registre de manifestes l’appliquent tous les deux. Les hôtes plus anciens ignorent les Plugins externes ; les chaînes de version invalides sont rejetées. Les Plugins source groupés sont supposés être co-versionnés avec le checkout de l’hôte.
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
    `allowInvalidConfigRecovery` n’est pas un contournement général pour les configurations cassées. Il est réservé à une récupération étroite des Plugins groupés, afin que la réinstallation/configuration initiale puisse réparer des restes de mise à niveau connus, comme un chemin de Plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même Plugin. Si la configuration est cassée pour des raisons sans rapport, l’installation échoue toujours de manière fermée et indique à l’opérateur d’exécuter `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Chargement complet différé

Les Plugins de canal peuvent opter pour le chargement différé avec :

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

Lorsque cette option est activée, OpenClaw charge uniquement `setupEntry` pendant la phase de démarrage avant écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que le Gateway commence à écouter.

<Warning>
N’activez le chargement différé que lorsque votre `setupEntry` enregistre tout ce dont le Gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP, méthodes du Gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si votre entrée de configuration initiale/complète enregistre des méthodes RPC du Gateway, gardez-les sur un préfixe propre au Plugin. Les espaces de noms d’administration centrale réservés (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent détenus par le cœur et se résolvent toujours vers `operator.admin`.

## Manifeste de Plugin

Chaque Plugin natif doit fournir un `openclaw.plugin.json` à la racine du package. OpenClaw l’utilise pour valider la configuration sans exécuter le code du Plugin.

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

Même les plugins sans configuration doivent livrer un schéma. Un schéma vide est valide :

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

## Publication ClawHub

Pour les packages de plugins, utilisez la commande ClawHub propre au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’ancien alias de publication réservé aux Skills concerne les Skills. Les packages de plugins doivent toujours utiliser `clawhub package publish`.
</Note>

## Point d’entrée de configuration

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` qu’OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration (intégration, réparation de configuration, inspection des canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques de chiffrement, enregistrements CLI, services d’arrière-plan) pendant les flux de configuration.

Les canaux d’espace de travail groupés qui conservent des exports compatibles avec la configuration dans des modules annexes peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` au lieu de `defineSetupPluginEntry(...)`. Ce contrat groupé prend aussi en charge un export `runtime` facultatif afin que le câblage d’exécution au moment de la configuration reste léger et explicite.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Le canal est désactivé mais nécessite des surfaces de configuration/intégration.
    - Le canal est activé mais non configuré.
    - Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - L’objet plugin de canal (via `defineSetupPluginEntry`).
    - Toute route HTTP requise avant l’écoute du Gateway.
    - Toute méthode Gateway nécessaire pendant le démarrage.

    Ces méthodes Gateway de démarrage doivent quand même éviter les espaces de noms d’administration réservés du noyau, comme `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Les enregistrements CLI.
    - Les services d’arrière-plan.
    - Les imports d’exécution lourds (chiffrement, SDK).
    - Les méthodes Gateway nécessaires uniquement après le démarrage.

  </Accordion>
</AccordionGroup>

### Imports étroits des assistants de configuration

Pour les chemins chauds uniquement liés à la configuration, préférez les surfaces étroites d’assistants de configuration au module global plus large `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’import                    | À utiliser pour                                                                           | Exports clés                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants d’exécution au moment de la configuration qui restent disponibles dans `setupEntry` / démarrage différé des canaux | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime`                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/docs pour la configuration/l’installation                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Utilisez la surface plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils de configuration partagée complète, y compris les assistants de correctifs de configuration tels que `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Utilisez `createSetupTranslator(...)` pour les textes fixes de l’assistant de configuration. Il suit la locale de l’assistant CLI (`OPENCLAW_LOCALE`, puis les variables de locale du système) et revient à l’anglais par défaut. Conservez le texte de configuration propre au plugin dans le code appartenant au plugin et utilisez les clés de catalogue partagées uniquement pour les libellés de configuration communs, le texte d’état et le texte de configuration des plugins groupés officiels.

Les adaptateurs de correctifs de configuration restent sûrs à importer dans les chemins chauds. Leur recherche de surface de contrat de promotion groupée à compte unique est paresseuse, donc importer `plugin-sdk/setup-runtime` ne charge pas avidement la découverte des surfaces de contrat groupées avant que l’adaptateur ne soit réellement utilisé.

### Promotion de compte unique appartenant au canal

Lorsqu’un canal passe d’une configuration de premier niveau à compte unique à `channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues liées au compte dans `accounts.default`.

Les canaux groupés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de configuration :

- `singleAccountKeysToMove` : clés de premier niveau supplémentaires qui doivent être déplacées dans le compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces clés sont déplacées dans le compte promu ; les clés de stratégie/livraison partagées restent à la racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisir quel compte existant reçoit les valeurs promues

<Note>
Matrix est l’exemple groupé actuel. Si exactement un compte Matrix nommé existe déjà, ou si `defaultAccount` pointe vers une clé non canonique existante comme `Ops`, la promotion préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`.
</Note>

## Schéma de configuration

La configuration du plugin est validée avec le JSON Schema dans votre manifeste. Les utilisateurs configurent les plugins via :

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

### Construction de schémas de configuration de canal

Utilisez `buildChannelConfigSchema` pour convertir un schéma Zod en enveloppe `ChannelConfigSchema` utilisée par les artefacts de configuration appartenant au plugin :

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

Si vous rédigez déjà le contrat en JSON Schema ou TypeBox, utilisez l’assistant direct afin qu’OpenClaw puisse ignorer la conversion Zod vers JSON Schema sur les chemins de métadonnées :

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

Pour les plugins tiers, le contrat du chemin froid reste le manifeste du plugin : reproduisez le JSON Schema généré dans `openclaw.plugin.json#channelConfigs` afin que les surfaces de schéma de configuration, de configuration et d’interface puissent inspecter `channels.<id>` sans charger le code d’exécution.

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

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et plus encore. Consultez les packages de plugins groupés (par exemple le plugin Discord `src/channel.setup.ts`) pour des exemples complets.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Pour les invites de liste d’autorisation de DM qui n’ont besoin que du flux standard `note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration partagés de `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` et `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et les lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis `openclaw/plugin-sdk/setup` au lieu de recréer manuellement le même objet `status` dans chaque plugin.
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

    L’adaptateur/l’assistant facultatif généré échoue de manière fermée lors de vraies écritures de configuration. Ils réutilisent un message d’installation requise unique dans `validateInput`, `applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est défini.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Pour les interfaces de configuration adossées à un binaire, préférez les assistants délégués partagés au lieu de copier le même raccordement binaire/état dans chaque canal :

    - `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés, les indications, les scores et la détection binaire
    - `createCliPathTextInput(...)` pour les champs de texte adossés à des chemins
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` et `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer paresseusement vers un assistant complet plus lourd
    - `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` doit uniquement déléguer une décision `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/clawhub), puis installez :

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Les spécifications de paquets nues s’installent depuis npm pendant le basculement de lancement.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Utilisez npm lorsqu’un paquet n’a pas encore été déplacé vers ClawHub, ou lorsque vous avez besoin d’un
    chemin d’installation npm direct pendant la migration :

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dans le dépôt :** placez-les sous l’arborescence de l’espace de travail des plugins intégrés ; ils seront automatiquement découverts pendant la compilation.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
Pour les installations provenant de npm, `openclaw plugins install` installe le paquet dans un projet propre à chaque plugin sous `~/.openclaw/npm/projects`, avec les scripts de cycle de vie désactivés. Gardez les arborescences de dépendances des plugins en JS/TS pur et évitez les paquets qui nécessitent des compilations `postinstall`.
</Info>

<Note>
Le démarrage du Gateway n’installe pas les dépendances des plugins. Les flux d’installation npm/git/ClawHub sont responsables de la convergence des dépendances ; les dépendances des plugins locaux doivent déjà être installées.
</Note>

Les métadonnées des paquets intégrés sont explicites, et non déduites du JavaScript compilé au démarrage du Gateway. Les dépendances d’exécution appartiennent au paquet de plugin qui les possède ; le démarrage d’OpenClaw empaqueté ne répare ni ne duplique jamais les dépendances des plugins.

## Associé

- [Création de plugins](/fr/plugins/building-plugins) — guide de démarrage pas à pas
- [Manifeste de plugin](/fr/plugins/manifest) — référence complète du schéma de manifeste
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
