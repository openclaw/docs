---
read_when:
    - Vous avez besoin de la signature de type exacte de `definePluginEntry` ou `defineChannelPluginEntry`
    - Vous voulez comprendre le mode d’enregistrement (complet vs configuration initiale vs métadonnées CLI)
    - Vous recherchez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence de `definePluginEntry`, `defineChannelPluginEntry` et `defineSetupPluginEntry`
title: Points d’entrée de Plugin
x-i18n:
    generated_at: "2026-04-22T04:25:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Points d’entrée de Plugin

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

Pour les plugins installés, `package.json` doit orienter le chargement à l’exécution vers le
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

`extensions` et `setupEntry` restent des points d’entrée source valides pour le développement
en espace de travail et en checkout git. `runtimeExtensions` et `runtimeSetupEntry` sont préférés
lorsqu’OpenClaw charge un package installé et permettent aux packages npm d’éviter la compilation
TypeScript à l’exécution. Si un package installé ne déclare qu’un point d’entrée source TypeScript,
OpenClaw utilisera un homologue compilé `dist/*.js` correspondant lorsqu’il existe, puis reviendra au source TypeScript.

Tous les chemins de point d’entrée doivent rester à l’intérieur du répertoire du package plugin. Les points d’entrée à l’exécution
et les homologues JavaScript compilés inférés ne rendent pas valide un chemin source `extensions` ou
`setupEntry` qui s’échappe du package.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour des guides détaillés.
</Tip>

## `definePluginEntry`

**Import :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseur, plugins d’outils, plugins de hook, et tout ce qui **n’est pas**
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

| Champ          | Type                                                             | Requis | Par défaut          |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`           | `string`                                                         | Oui    | —                   |
| `name`         | `string`                                                         | Oui    | —                   |
| `description`  | `string`                                                         | Oui    | —                   |
| `kind`         | `string`                                                         | Non    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui    | —                   |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` est destiné aux emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et met en cache ce schéma au premier accès, de sorte que les constructeurs de schéma coûteux
  ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Encapsule `definePluginEntry` avec un câblage spécifique aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose une couture facultative de métadonnées CLI d’aide racine, et contrôle `registerFull` selon le mode d’enregistrement.

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

| Champ                 | Type                                                             | Requis | Par défaut          |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                  | `string`                                                         | Oui    | —                   |
| `name`                | `string`                                                         | Oui    | —                   |
| `description`         | `string`                                                         | Oui    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non    | —                   |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence d’exécution
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture
  des métadonnées CLI.
- `registerCliMetadata` s’exécute à la fois pendant `api.registrationMode === "cli-metadata"`
  et `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI appartenant au canal afin que l’aide racine
  reste non activante tout en conservant la compatibilité avec l’enregistrement normal des commandes CLI
  lors des chargements complets de plugin.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  pendant le chargement configuration initiale uniquement.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  met en cache le schéma résolu au premier accès.
- Pour les commandes CLI racine appartenant au plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de l’arbre d’analyse
  de la CLI racine. Pour les plugins de canal, préférez enregistrer ces descripteurs
  depuis `registerCliMetadata(...)` et gardez `registerFull(...)` centré sur le travail réservé à l’exécution.
- Si `registerFull(...)` enregistre aussi des méthodes RPC Gateway, gardez-les sur un
  préfixe propre au plugin. Les espaces de noms d’administration centraux réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours forcés vers
  `operator.admin`.

## `defineSetupPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie uniquement `{ plugin }` sans
câblage d’exécution ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw le charge à la place du point d’entrée complet lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Consultez
[Configuration initiale et configuration](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela compte.

En pratique, associez `defineSetupPluginEntry(...)` aux familles de helpers de configuration initiale étroites :

- `openclaw/plugin-sdk/setup-runtime` pour les helpers de configuration initiale sûrs à l’exécution tels que
  les adaptateurs de patch de configuration initiale import-safe, la sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les proxys de configuration initiale délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de configuration initiale à installation facultative
- `openclaw/plugin-sdk/setup-tools` pour les helpers CLI/archive/docs de configuration initiale et d’installation

Gardez les SDK lourds, l’enregistrement CLI et les services d’exécution longue durée dans le point d’entrée complet.

Les canaux d’espace de travail intégrés qui séparent les surfaces de configuration initiale et d’exécution peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet au
point d’entrée de configuration initiale de conserver des exportations plugin/secrets sûres pour la configuration initiale tout en exposant un
setter d’exécution :

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

Utilisez ce contrat intégré uniquement lorsque les flux de configuration initiale ont réellement besoin d’un setter d’exécution léger
avant le chargement du point d’entrée complet du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode              | Quand                              | Que faut-il enregistrer                                                                   |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal du Gateway        | Tout                                                                                      |
| `"setup-only"`    | Canal désactivé/non configuré      | Enregistrement du canal uniquement                                                        |
| `"setup-runtime"` | Flux de configuration initiale avec exécution disponible | Enregistrement du canal plus seulement l’exécution légère nécessaire avant le chargement du point d’entrée complet |
| `"cli-metadata"`  | Aide racine / capture de métadonnées CLI | Descripteurs CLI uniquement                                                         |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez vous-même le mode :

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Enregistrements lourds réservés à l’exécution
  api.registerService(/* ... */);
}
```

Traitez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage configuration initiale uniquement doivent
exister sans réentrer dans l’exécution complète du canal intégré. Les bons cas d’usage sont
l’enregistrement du canal, les routes HTTP sûres pour la configuration initiale, les méthodes Gateway sûres pour la configuration initiale, et
les helpers de configuration initiale délégués. Les services lourds en arrière-plan, les enregistreurs CLI, et
les initialisations de SDK fournisseur/client doivent toujours rester dans `"full"`.

Pour les enregistreurs CLI en particulier :

- utilisez `descriptors` lorsque l’enregistreur possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI à la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier niveau exposée par l’
  enregistreur
- utilisez `commands` seul uniquement pour les chemins de compatibilité eager

## Formes de plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un type de capacité (par ex. fournisseur uniquement) |
| **hybrid-capability** | Plusieurs types de capacité (par ex. fournisseur + speech) |
| **hook-only**         | Hooks uniquement, aucune capacité                  |
| **non-capability**    | Outils/commandes/services mais aucune capacité     |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Liens associés

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — API d’enregistrement et référence des sous-chemins
- [Helpers d’exécution](/fr/plugins/sdk-runtime) — `api.runtime` et `createPluginRuntimeStore`
- [Configuration initiale et configuration](/fr/plugins/sdk-setup) — manifeste, point d’entrée de configuration initiale, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — construction de l’objet `ChannelPlugin`
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — enregistrement des fournisseurs et hooks
