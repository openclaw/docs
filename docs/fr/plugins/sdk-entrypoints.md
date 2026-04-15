---
read_when:
    - Vous avez besoin de la signature de type exacte de definePluginEntry ou de defineChannelPluginEntry
    - Vous souhaitez comprendre le mode d’enregistrement (complet vs configuration vs métadonnées CLI)
    - Vous recherchez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée du Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Points d’entrée du Plugin

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Channel Plugins](/fr/plugins/sdk-channel-plugins)
  ou [Provider Plugins](/fr/plugins/sdk-provider-plugins) pour des guides étape par étape.
</Tip>

## `definePluginEntry`

**Importation :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseur, les plugins d’outils, les plugins de hooks, et tout ce qui **n’est pas**
un canal de messagerie.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Champ          | Type                                                             | Obligatoire | Par défaut          |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Oui         | —                   |
| `name`         | `string`                                                         | Oui         | —                   |
| `description`  | `string`                                                         | Oui         | —                   |
| `kind`         | `string`                                                         | Non         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui         | —                   |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` est utilisé pour les emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et mémorise ce schéma lors du premier accès, donc les générateurs de schéma coûteux
  ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Encapsule `definePluginEntry` avec un câblage spécifique aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose une jonction facultative de métadonnées CLI
pour l’aide racine, et conditionne `registerFull` selon le mode d’enregistrement.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Champ                 | Type                                                             | Obligatoire | Par défaut          |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Oui         | —                   |
| `name`                | `string`                                                         | Oui         | —                   |
| `description`         | `string`                                                         | Oui         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non         | —                   |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence d’exécution
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture
  des métadonnées CLI.
- `registerCliMetadata` s’exécute à la fois lorsque `api.registrationMode === "cli-metadata"`
  et lorsque `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI possédés par le canal afin que l’aide racine
  reste non activante tout en conservant la compatibilité de l’enregistrement normal des commandes CLI
  avec les chargements complets de plugins.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  lors du chargement pour la configuration uniquement.
- Comme pour `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  mémorise le schéma résolu lors du premier accès.
- Pour les commandes CLI racine appartenant au plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de l’arbre
  d’analyse de la CLI racine. Pour les plugins de canal, préférez enregistrer ces descripteurs
  depuis `registerCliMetadata(...)` et gardez `registerFull(...)` centré sur le travail réservé à l’exécution.
- Si `registerFull(...)` enregistre aussi des méthodes RPC Gateway, conservez-les avec un
  préfixe spécifique au plugin. Les espaces de noms d’administration du cœur réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours forcés en
  `operator.admin`.

## `defineSetupPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Retourne simplement `{ plugin }` sans
câblage d’exécution ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci au lieu du point d’entrée complet lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Consultez
[Setup and Config](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela a de l’importance.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites de helpers de configuration :

- `openclaw/plugin-sdk/setup-runtime` pour les helpers de configuration sûrs à l’exécution, tels que
  les adaptateurs de patch de configuration sûrs à l’importation, la sortie de notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les proxys de configuration délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de configuration d’installation facultative
- `openclaw/plugin-sdk/setup-tools` pour les helpers de CLI/archive/documentation de configuration et d’installation

Conservez les SDK lourds, l’enregistrement CLI et les services d’exécution de longue durée dans le point
d’entrée complet.

Les canaux de l’espace de travail groupé qui séparent les surfaces de configuration et d’exécution peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet au point d’entrée
de configuration de conserver des exportations de plugin/secrets sûres pour la configuration tout en exposant
un setter d’exécution :

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Utilisez ce contrat groupé uniquement lorsque les flux de configuration ont réellement besoin d’un setter
d’exécution léger avant le chargement du point d’entrée complet du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode              | Quand                             | Ce qu’il faut enregistrer                                                               |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal de Gateway       | Tout                                                                                    |
| `"setup-only"`    | Canal désactivé/non configuré     | Enregistrement du canal uniquement                                                      |
| `"setup-runtime"` | Flux de configuration avec exécution disponible | Enregistrement du canal plus uniquement l’exécution légère nécessaire avant le chargement du point d’entrée complet |
| `"cli-metadata"`  | Capture de l’aide racine / des métadonnées CLI | Descripteurs CLI uniquement                                                             |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez le mode vous-même :

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Traitez `"setup-runtime"` comme la fenêtre dans laquelle les surfaces de démarrage réservées à la configuration doivent
exister sans réintégrer l’exécution complète du canal groupé. Les bons cas d’usage sont
l’enregistrement du canal, les routes HTTP sûres pour la configuration, les méthodes Gateway sûres pour la configuration, et
les helpers de configuration délégués. Les services d’arrière-plan lourds, les enregistreurs CLI, et
les initialisations de SDK fournisseur/client appartiennent toujours à `"full"`.

Pour les enregistreurs CLI en particulier :

- utilisez `descriptors` lorsque l’enregistreur possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI lors de la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier niveau exposée par l’enregistreur
- utilisez `commands` seul uniquement pour les chemins de compatibilité eager

## Formes de plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un seul type de capacité (par ex. fournisseur uniquement) |
| **hybrid-capability** | Plusieurs types de capacité (par ex. fournisseur + parole) |
| **hook-only**         | Seulement des hooks, aucune capacité               |
| **non-capability**    | Outils/commandes/services mais aucune capacité     |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Voir aussi

- [SDK Overview](/fr/plugins/sdk-overview) — API d’enregistrement et référence des sous-chemins
- [Runtime Helpers](/fr/plugins/sdk-runtime) — `api.runtime` et `createPluginRuntimeStore`
- [Setup and Config](/fr/plugins/sdk-setup) — manifeste, point d’entrée de configuration, chargement différé
- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — construction de l’objet `ChannelPlugin`
- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — enregistrement des fournisseurs et hooks
