---
read_when:
    - Vous avez besoin de la signature de type exacte de defineToolPlugin, definePluginEntry ou defineChannelPluginEntry
    - Vous voulez comprendre le mode d’enregistrement (complet vs configuration vs métadonnées CLI)
    - Vous consultez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour defineToolPlugin, definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée du Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit des assistants pour
les créer.

Pour les plugins installés, `package.json` doit orienter le chargement d’exécution vers le
JavaScript compilé lorsqu’il est disponible :

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` et `setupEntry` restent des entrées source valides pour le développement
dans un espace de travail et dans un checkout git. `runtimeExtensions` et
`runtimeSetupEntry` sont préférés lorsqu’OpenClaw charge un paquet installé et permettent
aux paquets npm d’éviter la compilation TypeScript à l’exécution. Les entrées d’exécution
explicites sont obligatoires : `runtimeSetupEntry` exige `setupEntry`, et les artefacts
`runtimeExtensions` ou `runtimeSetupEntry` manquants font échouer l’installation/la
découverte au lieu de revenir silencieusement à la source. Si un paquet installé ne déclare
qu’une entrée source TypeScript, OpenClaw utilisera un pair `dist/*.js` compilé correspondant
s’il existe, puis reviendra à la source TypeScript.

Tous les chemins d’entrée doivent rester à l’intérieur du répertoire du paquet du plugin.
Les entrées d’exécution et les pairs JavaScript compilés déduits ne rendent pas valide un
chemin source `extensions` ou `setupEntry` qui s’en échappe.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Plugins d’outils](/fr/plugins/tool-plugins),
  [Plugins de canaux](/fr/plugins/sdk-channel-plugins) ou
  [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins) pour des guides étape par étape.
</Tip>

## `defineToolPlugin`

**Importation :** `openclaw/plugin-sdk/tool-plugin`

Pour les plugins simples qui ajoutent uniquement des outils d’agent. `defineToolPlugin` garde
la source d’écriture réduite, déduit les types de configuration et de paramètres d’outil à partir des
schémas TypeBox, encapsule les valeurs de retour simples dans le format de résultat d’outil
OpenClaw, et expose des métadonnées statiques que `openclaw plugins build` écrit dans le
manifeste du plugin.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` est facultatif. Lorsqu’il est omis, OpenClaw utilise un schéma d’objet vide
  strict et le manifeste généré inclut tout de même `configSchema`.
- `execute` renvoie une chaîne simple ou une valeur sérialisable en JSON. L’assistant l’encapsule
  sous forme de résultat d’outil textuel avec `details`.
- Les noms d’outils sont statiques. `openclaw plugins build` dérive `contracts.tools`
  des outils déclarés, afin que les auteurs n’aient pas à dupliquer les noms manuellement.
- Le chargement d’exécution reste strict. Les plugins installés ont toujours besoin de
  `openclaw.plugin.json` et de `package.json` `openclaw.extensions` ; OpenClaw n’exécute
  pas le code du plugin pour déduire des données de manifeste manquantes.

## `definePluginEntry`

**Importation :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseurs, les plugins d’outils avancés, les plugins de hooks et tout ce qui
n’est **pas** un canal de messagerie.

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

| Champ          | Type                                                             | Obligatoire | Valeur par défaut   |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Oui         | -                   |
| `name`         | `string`                                                         | Oui         | -                   |
| `description`  | `string`                                                         | Oui         | -                   |
| `kind`         | `string`                                                         | Non         | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui         | -                   |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` sert aux emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation différée.
- OpenClaw résout et mémoïse ce schéma au premier accès, de sorte que les générateurs de schémas
  coûteux ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Encapsule `definePluginEntry` avec le câblage propre aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose un seam facultatif de métadonnées CLI d’aide racine
et conditionne `registerFull` au mode d’inscription.

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

| Champ                 | Type                                                             | Obligatoire | Valeur par défaut   |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Oui         | -                   |
| `name`                | `string`                                                         | Oui         | -                   |
| `description`         | `string`                                                         | Oui         | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui         | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non         | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non         | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non         | -                   |

- `setRuntime` est appelé pendant l’inscription afin que vous puissiez stocker la référence d’exécution
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture des métadonnées CLI.
- `registerCliMetadata` s’exécute pendant `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` et
  `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI détenus par le canal, afin que l’aide racine
  reste non activante, que les instantanés de découverte incluent les métadonnées de commande statiques, et que
  l’inscription normale des commandes CLI reste compatible avec les chargements complets de plugins.
- L’inscription de découverte est non activante, pas sans importation. OpenClaw peut
  évaluer l’entrée de plugin approuvée et le module du plugin de canal pour construire
  l’instantané ; gardez donc les importations de niveau supérieur sans effets de bord et placez les sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  pendant le chargement réservé à la configuration.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique différée et OpenClaw
  mémoïse le schéma résolu au premier accès.
- Pour les commandes CLI racine détenues par un plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de l’arbre d’analyse
  de la CLI racine. Pour les commandes de fonctionnalité de nœuds appariés, préférez
  `api.registerNodeCliFeature(...)` afin que la commande arrive sous `openclaw nodes`.
  Pour les autres commandes de plugin imbriquées, ajoutez `parentPath` et inscrivez les commandes sur
  l’objet `program` transmis au registraire ; OpenClaw le résout vers la commande parente
  avant d’appeler le plugin. Pour les plugins de canaux, préférez inscrire ces descripteurs depuis
  `registerCliMetadata(...)` et gardez `registerFull(...)` centré sur le travail réservé à l’exécution.
- Si `registerFull(...)` inscrit aussi des méthodes RPC Gateway, gardez-les sous un préfixe
  propre au plugin. Les espaces de noms d’administration cœur réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours contraints à
  `operator.admin`.

## `defineSetupPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie seulement `{ plugin }`, sans câblage
d’exécution ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge cela au lieu de l’entrée complète lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Consultez
[Configuration](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela compte.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites d’assistants de configuration :

- `openclaw/plugin-sdk/setup-runtime` pour les assistants de configuration sûrs à l’exécution, tels que
  `createSetupTranslator`, les adaptateurs de patch de configuration sûrs à importer, la sortie de notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les proxys de configuration délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de configuration d’installation facultative
- `openclaw/plugin-sdk/setup-tools` pour les assistants de configuration/installation CLI/archive/docs

Gardez les SDK lourds, l’inscription CLI et les services d’exécution longue durée dans l’entrée complète.

Les canaux groupés de l’espace de travail qui séparent les surfaces de configuration et d’exécution peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet à l’entrée de configuration de
conserver les exports plugin/secrets sûrs pour la configuration tout en exposant aussi un setter
d’exécution :

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
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Utilisez ce contrat groupé uniquement lorsque les flux de configuration ont réellement besoin d’un setter d’exécution
léger ou d’une surface Gateway sûre pour la configuration avant le chargement de l’entrée complète du canal.
`registerSetupRuntime` ne s’exécute que pour les chargements `"setup-runtime"` ; limitez-le aux
routes ou méthodes uniquement liées à la configuration qui doivent exister avant l’activation complète différée.

## Mode d’inscription

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode              | Quand                             | Ce qu’il faut enregistrer                                                                                                  |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal du Gateway       | Tout                                                                                                                       |
| `"discovery"`     | Découverte de capacités en lecture seule | Enregistrement du canal plus descripteurs CLI statiques ; le code d’entrée peut se charger, mais ignorez sockets, workers, clients et services |
| `"setup-only"`    | Canal désactivé/non configuré     | Enregistrement du canal uniquement                                                                                         |
| `"setup-runtime"` | Flux de configuration avec runtime disponible | Enregistrement du canal plus uniquement le runtime léger nécessaire avant le chargement complet de l’entrée                 |
| `"cli-metadata"`  | Aide racine / capture des métadonnées CLI | Descripteurs CLI uniquement                                                                                                |

`defineChannelPluginEntry` gère cette séparation automatiquement. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez vous-même le mode :

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Le mode de découverte construit un instantané de registre non activant. Il peut
tout de même évaluer l’entrée du plugin et l’objet du plugin de canal afin
qu’OpenClaw puisse enregistrer les capacités de canal et les descripteurs CLI
statiques. Considérez l’évaluation de module en mode découverte comme fiable mais
légère : aucun client réseau, sous-processus, écouteur, connexion à une base de
données, worker en arrière-plan, lecture d’identifiants ou autre effet de bord
runtime actif au niveau supérieur.

Considérez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage
réservées à la configuration doivent exister sans réentrer dans le runtime complet
du canal groupé. Les bons cas d’usage sont l’enregistrement du canal, les routes
HTTP sûres pour la configuration, les méthodes Gateway sûres pour la configuration
et les assistants de configuration délégués. Les services lourds en arrière-plan,
les registraires CLI et les initialisations de SDK provider/client appartiennent
toujours à `"full"`.

Pour les registraires CLI en particulier :

- utilisez `descriptors` lorsque le registraire possède une ou plusieurs commandes
  racine et que vous voulez qu’OpenClaw charge paresseusement le vrai module CLI
  lors de la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier
  niveau exposée par le registraire
- limitez les noms de commandes des descripteurs aux lettres, chiffres, traits
  d’union et underscores, en commençant par une lettre ou un chiffre ; OpenClaw
  rejette les noms de descripteurs qui ne respectent pas cette forme et supprime
  les séquences de contrôle de terminal des descriptions avant le rendu de l’aide
- utilisez `commands` seul uniquement pour les chemins de compatibilité eager

## Formes de Plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                         |
| --------------------- | --------------------------------------------------- |
| **plain-capability**  | Un type de capacité (par ex. provider uniquement)   |
| **hybrid-capability** | Plusieurs types de capacités (par ex. provider + speech) |
| **hook-only**         | Hooks uniquement, aucune capacité                   |
| **non-capability**    | Outils/commandes/services, mais aucune capacité     |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Associé

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - API d’enregistrement et référence des sous-chemins
- [Assistants runtime](/fr/plugins/sdk-runtime) - `api.runtime` et `createPluginRuntimeStore`
- [Configuration et config](/fr/plugins/sdk-setup) - manifeste, entrée de configuration, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - construction de l’objet `ChannelPlugin`
- [Plugins provider](/fr/plugins/sdk-provider-plugins) - enregistrement de provider et hooks
