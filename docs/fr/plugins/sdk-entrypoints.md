---
read_when:
    - Vous avez besoin de la signature de type exacte de definePluginEntry ou defineChannelPluginEntry
    - Vous voulez comprendre le mode d’enregistrement (complet vs configuration vs métadonnées CLI)
    - Vous consultez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée du Plugin
x-i18n:
    generated_at: "2026-05-02T07:15:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Chaque Plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

Pour les Plugins installés, `package.json` doit orienter le chargement runtime vers le
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
dans l’espace de travail et depuis un checkout git. `runtimeExtensions` et
`runtimeSetupEntry` sont préférés quand OpenClaw charge un package installé et
permettent aux packages npm d’éviter la compilation TypeScript au runtime. Les
entrées runtime explicites sont requises : `runtimeSetupEntry` nécessite
`setupEntry`, et les artefacts `runtimeExtensions` ou `runtimeSetupEntry` manquants
font échouer l’installation/la découverte au lieu de revenir silencieusement à la
source. Si un package installé ne déclare qu’une entrée source TypeScript, OpenClaw
utilisera un pair `dist/*.js` compilé correspondant lorsqu’il existe, puis reviendra à
la source TypeScript.

Tous les chemins d’entrée doivent rester dans le répertoire du package Plugin. Les
entrées runtime et les pairs JavaScript compilés inférés ne rendent pas valide un
chemin source `extensions` ou `setupEntry` qui s’échappe du package.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour des guides détaillés.
</Tip>

## `definePluginEntry`

**Import :** `openclaw/plugin-sdk/plugin-entry`

Pour les Plugins de fournisseur, les Plugins d’outils, les Plugins de hooks, et tout
ce qui n’est **pas** un canal de messagerie.

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

| Champ          | Type                                                             | Obligatoire | Par défaut            |
| -------------- | ---------------------------------------------------------------- | ----------- | --------------------- |
| `id`           | `string`                                                         | Oui         | —                     |
| `name`         | `string`                                                         | Oui         | —                     |
| `description`  | `string`                                                         | Oui         | —                     |
| `kind`         | `string`                                                         | Non         | —                     |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui         | —                     |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` sert aux emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et mémoïse ce schéma au premier accès, de sorte que les
  constructeurs de schémas coûteux ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Enveloppe `definePluginEntry` avec un câblage propre aux canaux. Appelle
automatiquement `api.registerChannel({ plugin })`, expose un seam optionnel de
métadonnées CLI d’aide racine, et limite `registerFull` selon le mode
d’enregistrement.

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

| Champ                 | Type                                                             | Obligatoire | Par défaut            |
| --------------------- | ---------------------------------------------------------------- | ----------- | --------------------- |
| `id`                  | `string`                                                         | Oui         | —                     |
| `name`                | `string`                                                         | Oui         | —                     |
| `description`         | `string`                                                         | Oui         | —                     |
| `plugin`              | `ChannelPlugin`                                                  | Oui         | —                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non         | —                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non         | —                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non         | —                     |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence runtime
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture des métadonnées CLI.
- `registerCliMetadata` s’exécute pendant `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` et
  `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI détenus par le canal afin que l’aide racine
  reste non activante, que les instantanés de découverte incluent les métadonnées statiques de commande, et que
  l’enregistrement normal des commandes CLI reste compatible avec les chargements complets du Plugin.
- L’enregistrement de découverte est non activant, pas exempt d’import. OpenClaw peut
  évaluer l’entrée du Plugin fiable et le module du Plugin de canal pour construire
  l’instantané ; gardez donc les imports de premier niveau sans effets de bord et placez les sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  pendant le chargement setup-only.
- Comme `definePluginEntry`, `configSchema` peut être une factory paresseuse et OpenClaw
  mémoïse le schéma résolu au premier accès.
- Pour les commandes CLI racine détenues par le Plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de l’arbre
  d’analyse CLI racine. Pour les Plugins de canal, préférez enregistrer ces descripteurs
  depuis `registerCliMetadata(...)` et gardez `registerFull(...)` concentré sur le travail réservé au runtime.
- Si `registerFull(...)` enregistre aussi des méthodes RPC Gateway, gardez-les sous un
  préfixe propre au Plugin. Les espaces de noms d’administration cœur réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours contraints à
  `operator.admin`.

## `defineSetupPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Retourne simplement `{ plugin }` sans
câblage runtime ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci au lieu de l’entrée complète lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Consultez
[Setup et configuration](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela compte.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites de helpers de setup :

- `openclaw/plugin-sdk/setup-runtime` pour les helpers de setup sûrs au runtime, comme
  les adaptateurs de patch de setup sûrs à l’import, la sortie de notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les proxys de setup délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de setup d’installation optionnelle
- `openclaw/plugin-sdk/setup-tools` pour les helpers CLI/archive/docs de setup/installation

Gardez les SDK lourds, l’enregistrement CLI et les services runtime de longue durée dans
l’entrée complète.

Les canaux groupés de l’espace de travail qui séparent les surfaces de setup et de runtime peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet à
l’entrée de setup de conserver des exports Plugin/secrets sûrs pour le setup tout en exposant
un setter runtime :

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

Utilisez ce contrat groupé uniquement lorsque les flux de setup ont réellement besoin d’un setter runtime
léger avant le chargement de l’entrée complète du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre Plugin comment il a été chargé :

| Mode              | Quand                             | Ce qu’il faut enregistrer                                                                                                      |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal du Gateway       | Tout                                                                                                                            |
| `"discovery"`     | Découverte de capacités en lecture seule | Enregistrement du canal plus descripteurs CLI statiques ; le code d’entrée peut se charger, mais ignorez sockets, workers, clients et services |
| `"setup-only"`    | Canal désactivé/non configuré     | Enregistrement du canal uniquement                                                                                              |
| `"setup-runtime"` | Flux de setup avec runtime disponible | Enregistrement du canal plus uniquement le runtime léger nécessaire avant le chargement de l’entrée complète                    |
| `"cli-metadata"`  | Aide racine / capture des métadonnées CLI | Descripteurs CLI uniquement                                                                                                     |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez le mode vous-même :

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

Le mode découverte construit un instantané de registre non activant. Il peut néanmoins évaluer
l’entrée du Plugin et l’objet Plugin de canal afin qu’OpenClaw puisse enregistrer les
capacités du canal et les descripteurs CLI statiques. Traitez l’évaluation de module en découverte comme
fiable mais légère : aucun client réseau, sous-processus, listener, connexion à une base de données,
worker en arrière-plan, lecture d’identifiants, ni autre effet de bord runtime actif au premier niveau.

Traitez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage setup-only doivent
exister sans réentrer dans le runtime complet du canal groupé. Les bons usages sont
l’enregistrement de canal, les routes HTTP sûres pour le setup, les méthodes Gateway sûres pour le setup et
les helpers de setup délégués. Les services d’arrière-plan lourds, les registrars CLI et
les bootstraps de SDK fournisseur/client appartiennent toujours à `"full"`.

Pour les registrars CLI en particulier :

- utilisez `descriptors` lorsque le registrar possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI à la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier niveau exposée par le
  registrar
- limitez les noms de commande des descripteurs aux lettres, chiffres, traits d’union et underscores,
  en commençant par une lettre ou un chiffre ; OpenClaw rejette les noms de descripteurs hors de
  cette forme et retire les séquences de contrôle de terminal des descriptions avant
  le rendu de l’aide
- utilisez `commands` seul uniquement pour les chemins de compatibilité avides

## Formes de Plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                              |
| --------------------- | -------------------------------------------------------- |
| **plain-capability**  | Un type de capacité (par exemple, fournisseur uniquement) |
| **hybrid-capability** | Plusieurs types de capacité (par exemple, fournisseur + voix) |
| **hook-only**         | Uniquement des points d’accroche, aucune capacité        |
| **non-capability**    | Outils/commandes/services, mais aucune capacité          |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Associés

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — API d’enregistrement et référence des sous-chemins
- [Assistants d’exécution](/fr/plugins/sdk-runtime) — `api.runtime` et `createPluginRuntimeStore`
- [Configuration et paramétrage](/fr/plugins/sdk-setup) — manifeste, point d’entrée de configuration, chargement différé
- [Plugins de canaux](/fr/plugins/sdk-channel-plugins) — création de l’objet `ChannelPlugin`
- [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins) — enregistrement des fournisseurs et points d’accroche
