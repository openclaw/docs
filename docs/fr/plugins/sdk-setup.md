---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre setup-entry.ts par rapport à index.ts
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées OpenClaw dans package.json
sidebarTitle: Setup and config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées de package.json
title: Configuration et paramétrage du Plugin
x-i18n:
    generated_at: "2026-07-12T15:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Référence pour l’empaquetage des plugins (métadonnées de `package.json`), les manifestes (`openclaw.plugin.json`), les points d’entrée de configuration et les schémas de configuration.

<Tip>
**Vous recherchez un guide pas à pas ?** Les guides pratiques abordent l’empaquetage dans son contexte : [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du paquet

Votre fichier `package.json` doit comporter un champ `openclaw` qui indique au système de plugins ce que fournit votre plugin :

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
          "label": "Mon canal",
          "blurb": "Brève description du canal."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin de fournisseur / base de référence ClawHub">
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
La publication externe sur ClawHub nécessite `compat` et `build`. Les extraits de publication canoniques se trouvent dans `docs/snippets/plugin-publish/`.
</Note>

### Champs `openclaw`

<ParamField path="extensions" type="string[]">
  Fichiers de point d’entrée (relatifs à la racine du paquet). Entrées source valides pour le développement dans un espace de travail et une extraction Git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Équivalents JavaScript compilés de `extensions`, privilégiés lorsqu’OpenClaw charge un paquet npm installé. Consultez [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) pour connaître l’ordre de résolution entre la source et la version compilée.
</ParamField>
<ParamField path="setupEntry" type="string">
  Point d’entrée léger réservé à la configuration (facultatif).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Équivalent JavaScript compilé de `setupEntry`. Nécessite également la définition de `setupEntry`.
</ParamField>
<ParamField path="plugin" type="object">
  Identité de plugin de secours `{ id, label }`, utilisée lorsqu’un plugin ne possède aucune métadonnée de canal ou de fournisseur permettant d’en déduire un identifiant ou un libellé.
</ParamField>
<ParamField path="channel" type="object">
  Métadonnées du catalogue de canaux pour les interfaces de configuration, de sélection, de démarrage rapide et d’état.
</ParamField>
<ParamField path="install" type="object">
  Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Indicateurs de comportement au démarrage.
</ParamField>
<ParamField path="compat" type="object">
  Plage de versions de `pluginApi` prise en charge par ce plugin. Obligatoire pour les publications externes sur ClawHub.
</ParamField>

<Note>
Les identifiants de fournisseurs (`providers: string[]`) sont des métadonnées de manifeste, et non des métadonnées de paquet. Déclarez-les dans `openclaw.plugin.json`, et non ici — consultez [Manifeste de plugin](/fr/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` contient des métadonnées de paquet légères destinées à la découverte des canaux et aux interfaces de configuration avant le chargement de l’environnement d’exécution.

| Champ                                  | Type       | Signification                                                                   |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identifiant canonique du canal.                                                 |
| `label`                                | `string`   | Libellé principal du canal.                                                     |
| `selectionLabel`                       | `string`   | Libellé de sélection/configuration lorsqu’il doit différer de `label`.          |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour les catalogues de canaux et interfaces d’état enrichis. |
| `docsPath`                             | `string`   | Chemin de la documentation pour les liens de configuration et de sélection.    |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens vers la documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Brève description pour l’intégration initiale et le catalogue.                 |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                     |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                 |
| `preferOver`                           | `string[]` | Identifiants de plugins/canaux de priorité inférieure sur lesquels ce canal doit prévaloir. |
| `systemImage`                          | `string`   | Nom facultatif d’icône ou d’image système pour les catalogues de canaux de l’interface utilisateur. |
| `selectionDocsPrefix`                  | `string`   | Texte préfixé aux liens vers la documentation dans les interfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de la documentation plutôt qu’un lien libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Indique que le canal prend en charge Markdown pour les décisions de mise en forme sortante. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour la configuration, les listes configurées et les interfaces de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Inclut ce canal dans le flux de configuration standard `allowFrom` du démarrage rapide. |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison explicite du compte même lorsqu’un seul compte existe.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Privilégie la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

Exemple :

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Mon canal",
      "selectionLabel": "Mon canal (auto-hébergé)",
      "detailLabel": "Bot de mon canal",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Intégration de chat auto-hébergée reposant sur un Webhook.",
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

- `configured` : inclut le canal dans les interfaces de liste des éléments configurés ou d’état
- `setup` : inclut le canal dans les sélecteurs interactifs de configuration
- `docs` : indique que le canal est public dans les interfaces de documentation et de navigation

<Note>
`showConfigured` et `showInSetup` restent pris en charge en tant qu’alias hérités. Privilégiez `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` contient des métadonnées de paquet, et non des métadonnées de manifeste.

| Champ                        | Type                                | Signification                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spécification ClawHub canonique pour les flux d’installation/mise à jour et d’installation à la demande lors de l’intégration initiale. |
| `npmSpec`                    | `string`                            | Spécification npm canonique pour les flux d’installation/mise à jour de secours. |
| `localPath`                  | `string`                            | Chemin d’installation local pour le développement ou chemin d’installation intégré. |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Source d’installation privilégiée lorsque plusieurs sources sont disponibles.   |
| `minHostVersion`             | `string`                            | Version minimale d’OpenClaw prise en charge, `>=x.y.z` ou `>=x.y.z-prerelease`.  |
| `expectedIntegrity`          | `string`                            | Chaîne d’intégrité npm dist attendue, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`                           | Permet aux flux de réinstallation des plugins intégrés de récupérer après certaines défaillances dues à une configuration obsolète. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm propres à la plateforme requis et vérifiés lors de l’installation npm. |

<AccordionGroup>
  <Accordion title="Comportement de l’intégration initiale">
    L’intégration initiale interactive utilise `openclaw.install` pour les interfaces d’installation à la demande : si votre plugin expose des choix d’authentification de fournisseur ou des métadonnées de configuration/catalogue de canal avant le chargement de l’environnement d’exécution, l’intégration initiale peut proposer une installation depuis ClawHub, npm ou une source locale, installer ou activer le plugin, puis poursuivre le flux sélectionné. Les choix ClawHub utilisent `clawhubSpec` et sont privilégiés lorsqu’ils sont présents ; les choix npm nécessitent des métadonnées de catalogue fiables avec une valeur de registre `npmSpec` (les versions exactes et `expectedIntegrity` sont des épinglages facultatifs, appliqués lors de l’installation ou de la mise à jour lorsqu’ils sont définis). Conservez « ce qu’il faut afficher » dans `openclaw.plugin.json` et « comment l’installer » dans `package.json`.
  </Accordion>
  <Accordion title="Application de minHostVersion">
    Si `minHostVersion` est défini, l’installation et le chargement des plugins non intégrés depuis le registre des manifestes l’appliquent tous deux. Les hôtes plus anciens ignorent les plugins externes ; les chaînes de version non valides sont rejetées. Les plugins source intégrés sont supposés partager la même version que l’extraction de l’hôte.
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
    `allowInvalidConfigRecovery` ne constitue pas un contournement général pour les configurations défectueuses. Il est strictement réservé à la récupération des plugins intégrés et permet à la réinstallation ou à la configuration de réparer des résidus connus de mise à niveau, comme l’absence du chemin d’un plugin intégré ou une entrée `channels.<id>` obsolète pour ce même plugin. Si la configuration est défectueuse pour des raisons sans rapport, l’installation échoue toujours de manière fermée et demande à l’opérateur d’exécuter `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Chargement complet différé

Les plugins de canal peuvent activer le chargement différé avec :

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

Lorsque cette option est activée, OpenClaw charge uniquement `setupEntry` pendant la phase de démarrage précédant l’écoute, même pour les canaux déjà configurés. Le point d’entrée complet est chargé après que le Gateway a commencé à écouter.

<Warning>
N’activez le chargement différé que si votre `setupEntry` enregistre tout ce dont le Gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP, méthodes du Gateway). Si le point d’entrée complet fournit des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si vos points d’entrée de configuration ou complet enregistrent des méthodes RPC du Gateway, conservez-les sous un préfixe propre au plugin. Les espaces de noms d’administration réservés au cœur (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent la propriété du cœur et sont toujours normalisés en `operator.admin`.

## Manifeste de plugin

Chaque Plugin natif doit fournir un fichier `openclaw.plugin.json` à la racine du paquet. OpenClaw l’utilise pour valider la configuration sans exécuter le code du Plugin.

```json
{
  "id": "my-plugin",
  "name": "Mon Plugin",
  "description": "Ajoute les fonctionnalités de Mon Plugin à OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Secret de vérification du Webhook"
      }
    }
  }
}
```

Pour les Plugins de canal, ajoutez `channels` (et, pour les Plugins de fournisseur, ajoutez `providers`) :

```json
{
  "id": "my-channel",
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

## Publication sur ClawHub

Les Skills et les paquets de Plugins utilisent des commandes de publication ClawHub distinctes. Pour les paquets de Plugins, utilisez la commande propre aux paquets :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` est une commande différente, destinée à publier un dossier de Skill et non un paquet de Plugin. Consultez [Publication sur ClawHub](/fr/clawhub/publishing).
</Note>

## Point d’entrée de configuration

`setup-entry.ts` est une alternative légère à `index.ts` qu’OpenClaw charge lorsqu’il a uniquement besoin des surfaces de configuration (intégration initiale, réparation de la configuration, inspection des canaux désactivés) :

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques cryptographiques, enregistrements de CLI, services en arrière-plan) pendant les flux de configuration.

Les canaux intégrés à l’espace de travail qui conservent des exportations sûres pour la configuration dans des modules auxiliaires peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` à la place de `defineSetupPluginEntry(...)`. Ce contrat intégré prend également en charge une exportation `runtime` facultative afin que le câblage de l’environnement d’exécution pendant la configuration reste léger et explicite.

<AccordionGroup>
  <Accordion title="Quand OpenClaw utilise setupEntry à la place du point d’entrée complet">
    - Le canal est désactivé, mais nécessite des surfaces de configuration ou d’intégration initiale.
    - Le canal est activé, mais n’est pas configuré.
    - Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Ce que setupEntry doit enregistrer">
    - L’objet Plugin du canal (via `defineSetupPluginEntry`).
    - Toutes les routes HTTP requises avant la mise en écoute du Gateway.
    - Toutes les méthodes du Gateway nécessaires au démarrage.

    Ces méthodes du Gateway utilisées au démarrage doivent néanmoins éviter les espaces de noms d’administration réservés au cœur, tels que `config.*` ou `update.*`.

  </Accordion>
  <Accordion title="Ce que setupEntry ne doit PAS inclure">
    - Les enregistrements de CLI.
    - Les services en arrière-plan.
    - Les importations lourdes liées à l’environnement d’exécution (cryptographie, SDK).
    - Les méthodes du Gateway nécessaires uniquement après le démarrage.

  </Accordion>
</AccordionGroup>

### Importations ciblées des assistants de configuration

Pour les chemins critiques réservés à la configuration, préférez les interfaces ciblées des assistants de configuration au module général `plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’importation                | Utilisation                                                                               | Exportations principales                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | assistants d’exécution pendant la configuration qui restent disponibles dans `setupEntry` ou lors du démarrage différé du canal | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime`                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`            | assistants de CLI, d’archive, de documentation et d’installation                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Utilisez l’interface générale `plugin-sdk/setup` lorsque vous souhaitez disposer de l’ensemble complet des outils de configuration partagés, notamment des assistants de modification de configuration tels que `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Utilisez `createSetupTranslator(...)` pour les textes fixes de l’assistant de configuration. Il respecte les paramètres régionaux de l’assistant CLI (`OPENCLAW_LOCALE`, puis les variables de paramètres régionaux du système) et utilise l’anglais comme solution de repli. Conservez les textes de configuration propres au Plugin dans le code appartenant au Plugin et utilisez les clés du catalogue partagé uniquement pour les libellés de configuration communs, les textes d’état et les textes de configuration des Plugins officiels intégrés.

Les adaptateurs de modification de configuration restent sûrs à importer dans les chemins critiques. Leur recherche de la surface contractuelle de promotion des comptes uniques intégrés est différée ; l’importation de `plugin-sdk/setup-runtime` ne charge donc pas immédiatement la détection des surfaces contractuelles intégrées avant l’utilisation effective de l’adaptateur.

### Promotion d’un compte unique gérée par le canal

Lorsqu’un canal passe d’une configuration de compte unique au niveau supérieur à `channels.<id>.accounts.*`, le comportement partagé par défaut déplace les valeurs promues propres au compte vers `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion par l’intermédiaire de leur surface contractuelle de configuration :

- `singleAccountKeysToMove` : clés supplémentaires de niveau supérieur à déplacer vers le compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces clés sont déplacées vers le compte promu ; les clés partagées de stratégie et de livraison restent à la racine du canal
- `resolveSingleAccountPromotionTarget(...)` : sélectionne le compte existant qui reçoit les valeurs promues

<Note>
Matrix est l’exemple intégré actuel. S’il existe déjà exactement un compte Matrix nommé, ou si `defaultAccount` pointe vers une clé non canonique existante telle que `Ops`, la promotion conserve ce compte au lieu de créer une nouvelle entrée `accounts.default`.
</Note>

## Schéma de configuration

La configuration du Plugin est validée par rapport au schéma JSON de votre manifeste. Les utilisateurs configurent les Plugins ainsi :

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

Votre Plugin reçoit cette configuration sous la forme `api.pluginConfig` lors de l’enregistrement.

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

### Création des schémas de configuration de canal

Utilisez `buildChannelConfigSchema` pour convertir un schéma Zod en enveloppe `ChannelConfigSchema` utilisée par les artefacts de configuration appartenant au Plugin :

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

Si vous définissez déjà le contrat sous forme de schéma JSON ou avec TypeBox, utilisez l’assistant direct afin qu’OpenClaw puisse ignorer la conversion de Zod vers le schéma JSON sur les chemins de métadonnées :

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

Pour les Plugins tiers, le contrat des chemins non critiques reste le manifeste du Plugin : reproduisez le schéma JSON généré dans `openclaw.plugin.json#channelConfigs` afin que les surfaces de schéma de configuration, de configuration initiale et d’interface utilisateur puissent inspecter `channels.<id>` sans charger le code d’exécution.

## Assistants de configuration

Les Plugins de canal peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`. L’assistant est un objet `ChannelSetupWizard` sur le `ChannelPlugin` :

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
      credentialLabel: "Jeton du bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Utiliser MY_CHANNEL_BOT_TOKEN depuis l’environnement ?",
      keepPrompt: "Conserver le jeton actuel ?",
      inputPrompt: "Saisissez le jeton de votre bot :",
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

`ChannelSetupWizard` prend également en charge `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, entre autres. Consultez le fichier `src/setup-core.ts` du Plugin Discord pour un exemple intégré complet.

<AccordionGroup>
  <Accordion title="Invites allowFrom partagées">
    Pour les invites de liste d’autorisation des messages privés qui nécessitent uniquement le flux standard `note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)` et `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="État standard de configuration du canal">
    Pour les blocs d’état de configuration du canal qui ne varient que selon les libellés, les scores et les lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis `openclaw/plugin-sdk/setup` au lieu de recréer manuellement le même objet `status` dans chaque Plugin.
  </Accordion>
  <Accordion title="Surface facultative de configuration du canal">
    Pour les surfaces de configuration facultatives qui ne doivent apparaître que dans certains contextes, utilisez `createOptionalChannelSetupSurface` depuis `openclaw/plugin-sdk/channel-setup` :

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Mon canal",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Renvoie { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` expose également les constructeurs de plus bas niveau `createOptionalChannelSetupAdapter(...)` et `createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié de cette surface d’installation facultative.

    L’adaptateur/assistant facultatif généré échoue de manière sûre lors des écritures réelles de configuration. Il réutilise un même message indiquant qu’une installation est requise dans `validateInput`, `applyAccountConfig` et `finalize`, et ajoute un lien vers la documentation lorsque `docsPath` est défini.

  </Accordion>
  <Accordion title="Assistants de configuration reposant sur un binaire">
    Pour les interfaces de configuration reposant sur un binaire, privilégiez les assistants délégués partagés plutôt que de recopier la même logique de gestion du binaire et de l’état dans chaque canal :

    - `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés, les indications, les scores et la détection du binaire
    - `createCliPathTextInput(...)` pour les entrées de texte fondées sur un chemin
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` et `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit déléguer à la demande à un assistant complet plus conséquent
    - `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` doit uniquement déléguer une décision `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publication et installation

**Plugins externes :** publiez-les sur [ClawHub](/clawhub), puis installez-les :

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Les spécifications de paquet sans préfixe sont installées depuis npm pendant la transition du lancement, sauf si le nom correspond à l’identifiant d’un Plugin intégré ou officiel, auquel cas OpenClaw utilise plutôt cette copie locale/officielle. Utilisez `clawhub:`, `npm:`, `git:` ou `npm-pack:` pour sélectionner la source de manière déterministe — consultez [Gérer les Plugins](/fr/plugins/manage-plugins).

  </Tab>
  <Tab title="ClawHub uniquement">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spécification de paquet npm">
    Utilisez npm lorsqu’un paquet n’a pas encore été déplacé vers ClawHub, ou lorsque vous avez besoin d’un
    chemin d’installation npm direct pendant la migration :

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins du dépôt :** placez-les dans l’arborescence de l’espace de travail des Plugins intégrés ; ils sont automatiquement détectés pendant la compilation.

<Info>
Pour les installations provenant de npm, `openclaw plugins install` installe le paquet dans un projet propre à chaque Plugin sous `~/.openclaw/npm/projects`, avec les scripts de cycle de vie désactivés (`--ignore-scripts`). Veillez à ce que les arborescences de dépendances des Plugins soient exclusivement en JS/TS et évitez les paquets qui nécessitent des compilations `postinstall`.
</Info>

<Note>
Le démarrage du Gateway n’installe pas les dépendances des Plugins. Les flux d’installation npm/git/ClawHub assurent la convergence des dépendances ; les dépendances des Plugins locaux doivent déjà être installées.
</Note>

Les métadonnées des paquets intégrés sont explicites et ne sont pas déduites du JavaScript compilé au démarrage du Gateway. Les dépendances d’exécution appartiennent au paquet du Plugin qui les possède ; le démarrage d’une version empaquetée d’OpenClaw ne répare ni ne réplique jamais les dépendances des Plugins.

## Voir aussi

- [Création de Plugins](/fr/plugins/building-plugins) — guide de prise en main détaillé
- [Manifeste de Plugin](/fr/plugins/manifest) — référence complète du schéma du manifeste
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) — `definePluginEntry` et `defineChannelPluginEntry`
