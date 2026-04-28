---
read_when:
    - Vous avez besoin de la signature de type exacte de definePluginEntry ou defineChannelPluginEntry
    - Vous souhaitez comprendre le mode d’enregistrement (full vs setup vs métadonnées CLI)
    - Vous recherchez les options des points d’entrée
sidebarTitle: Entry Points
summary: Référence pour definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée de Plugin
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:53:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Chaque Plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

Pour les plugins installés, `package.json` doit pointer le chargement à l’exécution vers le
JavaScript compilé lorsqu’il est disponible :

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
dans l’espace de travail et avec un checkout git. `runtimeExtensions` et `runtimeSetupEntry` sont préférés
lorsqu’OpenClaw charge un package installé et permettent aux packages npm d’éviter la
compilation TypeScript à l’exécution. Si un package installé ne déclare qu’une entrée source
TypeScript, OpenClaw utilisera un pair compilé correspondant `dist/*.js` lorsqu’il existe, puis reviendra à la source TypeScript.

Tous les chemins d’entrée doivent rester à l’intérieur du répertoire du package Plugin. Les entrées d’exécution
et les pairs JavaScript compilés déduits ne rendent pas valide un chemin source `extensions` ou
`setupEntry` qui s’échappe du package.

<Tip>
  **Vous cherchez un guide pas à pas ?** Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseur, plugins d’outils, plugins de hooks, et tout ce qui n’est **pas**
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

| Champ          | Type                                                             | Requis | Par défaut         |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`           | `string`                                                         | Oui    | —                  |
| `name`         | `string`                                                         | Oui    | —                  |
| `description`  | `string`                                                         | Oui    | —                  |
| `kind`         | `string`                                                         | Non    | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui    | —                  |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` est destiné aux slots exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et mémoïse ce schéma au premier accès, afin que les constructeurs de schéma coûteux
  ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Enveloppe `definePluginEntry` avec le câblage spécifique aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose une couture facultative de métadonnées CLI root-help, et filtre `registerFull` selon le mode d’enregistrement.

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

| Champ                 | Type                                                             | Requis | Par défaut         |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`                  | `string`                                                         | Oui    | —                  |
| `name`                | `string`                                                         | Oui    | —                  |
| `description`         | `string`                                                         | Oui    | —                  |
| `plugin`              | `ChannelPlugin`                                                  | Oui    | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non    | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non    | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non    | —                  |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence d’exécution
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture
  des métadonnées CLI.
- `registerCliMetadata` s’exécute lorsque `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` et
  `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI détenus par le canal afin que l’aide racine
  reste non activante, que les snapshots de découverte incluent des métadonnées de commande statiques et que
  l’enregistrement normal des commandes CLI reste compatible avec les chargements complets de Plugin.
- L’enregistrement de découverte est non activant, pas sans import. OpenClaw peut
  évaluer l’entrée de Plugin de confiance et le module de Plugin de canal pour construire le
  snapshot ; gardez donc les imports de haut niveau sans effets de bord et placez sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  pendant le chargement setup-only.
- Comme pour `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  mémorise le schéma résolu au premier accès.
- Pour les commandes CLI root détenues par un Plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de
  l’arbre d’analyse CLI racine. Pour les plugins de canal, préférez enregistrer ces descripteurs
  depuis `registerCliMetadata(...)` et garder `registerFull(...)` centré sur le travail réservé à l’exécution.
- Si `registerFull(...)` enregistre aussi des méthodes RPC Gateway, gardez-les sur un
  préfixe spécifique au Plugin. Les espaces de noms admin réservés du cœur (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours forcés vers
  `operator.admin`.

## `defineSetupPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie simplement `{ plugin }` sans
câblage d’exécution ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci au lieu de l’entrée complète lorsqu’un canal est désactivé,
non configuré ou lorsque le chargement différé est activé. Voir
[Configuration et config](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela importe.

En pratique, associez `defineSetupPluginEntry(...)` aux familles de helpers de configuration étroites :

- `openclaw/plugin-sdk/setup-runtime` pour les helpers de configuration sûrs à l’exécution tels que
  les adaptateurs de patch de configuration sûrs à l’import, la sortie de lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les proxys de configuration délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de configuration à installation facultative
- `openclaw/plugin-sdk/setup-tools` pour les helpers CLI/archive/docs de configuration/installation

Gardez les SDK lourds, l’enregistrement CLI et les services d’exécution de longue durée dans l’entrée complète.

Les canaux intégrés de l’espace de travail qui séparent les surfaces de configuration et d’exécution peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet à
l’entrée de configuration de conserver des exports Plugin/secrets sûrs pour la configuration tout en exposant un
setter d’exécution :

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

Utilisez ce contrat intégré uniquement lorsque les flux de configuration ont réellement besoin d’un setter
d’exécution léger avant le chargement de l’entrée complète du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre Plugin comment il a été chargé :

| Mode              | Quand                               | Ce qu’il faut enregistrer                                                                                               |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal du Gateway         | Tout                                                                                                                    |
| `"discovery"`     | Découverte en lecture seule des capacités | Enregistrement du canal plus descripteurs CLI statiques ; le code d’entrée peut être chargé, mais ignorez sockets, workers, clients et services |
| `"setup-only"`    | Canal désactivé/non configuré       | Enregistrement du canal uniquement                                                                                      |
| `"setup-runtime"` | Flux de configuration avec exécution disponible | Enregistrement du canal plus uniquement l’exécution légère nécessaire avant le chargement de l’entrée complète          |
| `"cli-metadata"`  | Aide racine / capture des métadonnées CLI | Descripteurs CLI uniquement                                                                                             |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez vous-même le mode :

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

  // Enregistrements lourds réservés à l’exécution
  api.registerService(/* ... */);
}
```

Le mode découverte construit un snapshot de registre non activant. Il peut quand même évaluer
l’entrée du Plugin et l’objet Plugin de canal afin qu’OpenClaw puisse enregistrer les capacités du canal
et les descripteurs CLI statiques. Traitez l’évaluation du module en découverte comme
de confiance mais légère : pas de clients réseau, sous-processus, listeners, connexions de base de données,
workers en arrière-plan, lectures d’identifiants ni autres effets de bord d’exécution live au niveau supérieur.

Traitez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage réservées à la configuration doivent
exister sans réentrer dans l’exécution complète du canal intégré. Conviennent bien :
enregistrement du canal, routes HTTP sûres pour la configuration, méthodes Gateway sûres pour la configuration et
helpers de configuration délégués. Les services de fond lourds, enregistreurs CLI et
initialisations de SDK fournisseur/client restent du ressort de `"full"`.

Pour les enregistreurs CLI en particulier :

- utilisez `descriptors` lorsque l’enregistreur possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI lors de la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier niveau exposée par l’enregistreur
- gardez des noms de commande de descripteur limités aux lettres, chiffres, tiret et underscore,
  commençant par une lettre ou un chiffre ; OpenClaw rejette les noms de descripteur hors
  de cette forme et supprime les séquences de contrôle terminal des descriptions avant
  d’afficher l’aide
- utilisez `commands` seul uniquement pour les chemins de compatibilité eager

## Formes de Plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un type de capacité (par ex. fournisseur uniquement) |
| **hybrid-capability** | Plusieurs types de capacité (par ex. fournisseur + parole) |
| **hook-only**         | Uniquement des hooks, aucune capacité              |
| **non-capability**    | Outils/commandes/services mais aucune capacité     |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un Plugin.

## Connexe

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — API d’enregistrement et référence des sous-chemins
- [Helpers d’exécution](/fr/plugins/sdk-runtime) — `api.runtime` et `createPluginRuntimeStore`
- [Configuration et config](/fr/plugins/sdk-setup) — manifeste, entrée de configuration, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — construire l’objet `ChannelPlugin`
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — enregistrement des fournisseurs et hooks
