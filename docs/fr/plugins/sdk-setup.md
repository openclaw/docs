---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre la différence entre setup-entry.ts et index.ts
    - Vous définissez des schémas de configuration de plugin ou des métadonnées openclaw dans package.json
sidebarTitle: Setup and config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées de package.json
title: Configuration et paramétrage du Plugin
x-i18n:
    generated_at: "2026-05-02T07:16:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Référence pour l’empaquetage des Plugins (métadonnées `package.json`), les manifestes (`openclaw.plugin.json`), les entrées de configuration et les schémas de configuration.

<Tip>
**Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent l’empaquetage en contexte : [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` nécessite un champ `openclaw` qui indique au système de Plugins ce que fournit votre Plugin :

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
Si vous publiez le Plugin en externe sur ClawHub, ces champs `compat` et `build` sont requis. Les extraits de publication canoniques se trouvent dans `docs/snippets/plugin-publish/`.
</Note>

### Champs `openclaw`

<ParamField path="extensions" type="string[]">
  Fichiers de point d’entrée (relatifs à la racine du package).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entrée légère réservée à la configuration (facultative).
</ParamField>
<ParamField path="channel" type="object">
  Métadonnées de catalogue de canal pour les surfaces de configuration, de sélecteur, de démarrage rapide et d’état.
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

`openclaw.channel` contient des métadonnées de package légères pour la découverte des canaux et les surfaces de configuration avant le chargement au runtime.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Identifiant canonique du canal.                                                |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/de la configuration lorsqu’il doit différer de `label`.   |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.       |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Courte description d’intégration/de catalogue.                                 |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection de canal.                 |
| `preferOver`                           | `string[]` | Identifiants de Plugins/canaux de priorité inférieure que ce canal doit devancer. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/d’image système pour les catalogues d’interface de canal. |
| `selectionDocsPrefix`                  | `string`   | Texte de préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour la configuration, les listes configurées et les surfaces de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Active pour ce canal le flux standard de configuration de démarrage rapide `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison explicite de compte même lorsqu’il n’existe qu’un seul compte. |
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
- `docs` : marquer le canal comme public dans les surfaces de documentation/navigation

<Note>
`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` contient des métadonnées de package, pas des métadonnées de manifeste.

| Champ                        | Type                 | Signification                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.            |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou groupé.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z` ou `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité npm dist attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de Plugins groupés de récupérer après certaines défaillances de configuration obsolète. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    L’intégration interactive utilise aussi `openclaw.install` pour les surfaces d’installation à la demande. Si votre Plugin expose des choix d’authentification de fournisseur ou des métadonnées de configuration/catalogue de canal avant le chargement au runtime, l’intégration peut afficher ce choix, demander une installation npm ou locale, installer ou activer le Plugin, puis poursuivre le flux sélectionné. Les choix d’intégration npm nécessitent des métadonnées de catalogue fiables avec un `npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épingles facultatives. Si `expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent. Conservez les métadonnées « quoi afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer » dans `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Si `minHostVersion` est défini, l’installation et le chargement non groupé du registre de manifestes l’appliquent tous les deux. Les hôtes plus anciens ignorent les Plugins externes ; les chaînes de version invalides sont rejetées. Les Plugins source groupés sont supposés être co-versionnés avec le checkout hôte.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Pour les installations npm épinglées, conservez la version exacte dans `npmSpec` et ajoutez l’intégrité attendue de l’artéfact :

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
    `allowInvalidConfigRecovery` n’est pas un contournement général pour les configurations défectueuses. Il est réservé à une récupération étroite des Plugins groupés, afin que la réinstallation/configuration puisse réparer les restes de mise à niveau connus, comme un chemin de Plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même Plugin. Si la configuration est défectueuse pour des raisons sans rapport, l’installation échoue toujours en mode fermé et indique à l’opérateur d’exécuter `openclaw doctor --fix`.
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

Lorsque cette option est activée, OpenClaw ne charge que `setupEntry` pendant la phase de démarrage avant écoute, même pour les canaux déjà configurés. L’entrée complète se charge après que le Gateway commence à écouter.

<Warning>
N’activez le chargement différé que lorsque votre `setupEntry` enregistre tout ce dont le Gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP, méthodes Gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si votre entrée de configuration/complète enregistre des méthodes RPC Gateway, conservez-les sur un préfixe spécifique au Plugin. Les espaces de noms d’administration cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent propriété du cœur et se résolvent toujours vers `operator.admin`.

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

Consultez [Manifeste de Plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de Plugins, utilisez la commande ClawHub propre au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
L’ancien alias de publication réservé aux skills est destiné aux Skills. Les packages de Plugins doivent toujours utiliser `clawhub package publish`.
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

Les canaux d’espace de travail groupés qui conservent des exports sûrs pour la configuration dans des modules side-car peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` au lieu de `defineSetupPluginEntry(...)`. Ce contrat groupé prend aussi en charge un export `runtime` facultatif afin que le câblage d’exécution au moment de la configuration reste léger et explicite.

<AccordionGroup>
  <Accordion title="Quand OpenClaw utilise setupEntry au lieu de l’entrée complète">
    - Le canal est désactivé mais nécessite des surfaces de configuration/onboarding.
    - Le canal est activé mais non configuré.
    - Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Ce que setupEntry doit enregistrer">
    - L’objet Plugin de canal (via `defineSetupPluginEntry`).
    - Toutes les routes HTTP requises avant l’écoute du Gateway.
    - Toutes les méthodes de Gateway nécessaires pendant le démarrage.

    Ces méthodes de Gateway de démarrage doivent tout de même éviter les espaces de noms d’administration principaux réservés, comme `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="Ce que setupEntry ne doit PAS inclure">
    - Les enregistrements CLI.
    - Les services en arrière-plan.
    - Les imports d’exécution lourds (chiffrement, SDK).
    - Les méthodes de Gateway uniquement nécessaires après le démarrage.

  </Accordion>
</AccordionGroup>

### Imports étroits des assistants de configuration

Pour les chemins chauds uniquement dédiés à la configuration, préférez les coutures étroites d’assistance à la configuration plutôt que le point d’entrée global plus large `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’import                    | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants d’exécution au moment de la configuration qui restent disponibles dans `setupEntry` / le démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de compte sensibles à l’environnement                      | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/docs de configuration/installation                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Utilisez la couture plus large `plugin-sdk/setup` lorsque vous voulez toute la boîte à outils de configuration partagée, y compris les assistants de patch de configuration comme `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch de configuration restent sûrs à l’import sur les chemins chauds. Leur recherche groupée de surface de contrat de promotion à compte unique est paresseuse, donc importer `plugin-sdk/setup-runtime` ne charge pas avidement la découverte des surfaces de contrat groupées avant que l’adaptateur soit effectivement utilisé.

### Promotion à compte unique propre au canal

Lorsqu’un canal passe d’une configuration de haut niveau à compte unique à `channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues à portée de compte dans `accounts.default`.

Les canaux groupés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de configuration :

- `singleAccountKeysToMove` : clés de haut niveau supplémentaires qui doivent être déplacées dans le compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces clés sont déplacées dans le compte promu ; les clés partagées de stratégie/livraison restent à la racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisir quel compte existant reçoit les valeurs promues

<Note>
Matrix est l’exemple groupé actuel. Si exactement un compte Matrix nommé existe déjà, ou si `defaultAccount` pointe vers une clé non canonique existante comme `Ops`, la promotion conserve ce compte au lieu de créer une nouvelle entrée `accounts.default`.
</Note>

## Schéma de configuration

La configuration du Plugin est validée avec le schéma JSON de votre manifeste. Les utilisateurs configurent les plugins via :

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

Votre Plugin reçoit cette configuration sous forme de `api.pluginConfig` pendant l’enregistrement.

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

Pour les plugins tiers, le contrat de chemin froid reste le manifeste du Plugin : répliquez le schéma JSON généré dans `openclaw.plugin.json#channelConfigs` afin que le schéma de configuration, la configuration et les surfaces UI puissent inspecter `channels.<id>` sans charger le code d’exécution.

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

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et plus encore. Consultez les paquets de plugins groupés (par exemple le Plugin Discord `src/channel.setup.ts`) pour des exemples complets.

<AccordionGroup>
  <Accordion title="Invites allowFrom partagées">
    Pour les invites de liste d’autorisation DM qui n’ont besoin que du flux standard `note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` et `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="État standard de configuration de canal">
    Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et les lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis `openclaw/plugin-sdk/setup` au lieu de recréer manuellement le même objet `status` dans chaque Plugin.
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

    `plugin-sdk/channel-setup` expose également les constructeurs de plus bas niveau `createOptionalChannelSetupAdapter(...)` et `createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié de cette surface d’installation facultative.

    L’adaptateur/l’assistant facultatif généré échoue de façon fermée lors des écritures de configuration réelles. Ils réutilisent un même message d’installation requise dans `validateInput`, `applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est défini.

  </Accordion>
  <Accordion title="Assistants de configuration adossés à un binaire">
    Pour les UI de configuration adossées à un binaire, préférez les assistants délégués partagés au lieu de copier la même colle binaire/état dans chaque canal :

    - `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés, les indications, les scores et la détection de binaire
    - `createCliPathTextInput(...)` pour les saisies de texte adossées à un chemin
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` et `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit déléguer paresseusement à un assistant complet plus lourd
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

    OpenClaw essaie d’abord ClawHub et bascule automatiquement vers npm.

  </Tab>
  <Tab title="ClawHub uniquement">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spécification de paquet npm">
    Utilisez npm lorsqu’un paquet n’a pas encore migré vers ClawHub, ou lorsque vous avez besoin d’un
    chemin d’installation npm direct pendant la migration :

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins groupés et ils seront automatiquement découverts pendant la build.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
Pour les installations provenant de npm, `openclaw plugins install` installe le paquet sous `~/.openclaw/npm` avec les scripts de cycle de vie désactivés. Gardez les arbres de dépendances de Plugin en JS/TS pur et évitez les paquets qui nécessitent des builds `postinstall`.
</Info>

<Note>
Le démarrage du Gateway n’installe pas les dépendances de Plugin. Les flux d’installation npm/git/ClawHub possèdent la convergence des dépendances ; les plugins locaux doivent déjà avoir leurs dépendances installées.
</Note>

Les métadonnées du package groupé sont explicites, et non déduites du JavaScript compilé au démarrage du Gateway. Les dépendances d’exécution appartiennent au package du plugin qui les possède ; le démarrage d’OpenClaw packagé ne répare ni ne réplique jamais les dépendances de plugin.

## Articles connexes

- [Création de plugins](/fr/plugins/building-plugins) — guide de prise en main étape par étape
- [Manifeste du Plugin](/fr/plugins/manifest) — référence complète du schéma du manifeste
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
