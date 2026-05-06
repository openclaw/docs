---
read_when:
    - Vous avez besoin de la signature de type exacte de definePluginEntry ou defineChannelPluginEntry
    - Vous voulez comprendre le mode d’enregistrement (complet vs configuration vs métadonnées CLI)
    - Vous consultez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour definePluginEntry, defineChannelPluginEntry et defineSetupPluginEntry
title: Points d’entrée du Plugin
x-i18n:
    generated_at: "2026-05-06T07:33:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
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
dans l’espace de travail et les extractions git. `runtimeExtensions` et
`runtimeSetupEntry` sont préférés quand OpenClaw charge un paquet installé et
permettent aux paquets npm d’éviter la compilation TypeScript à l’exécution. Les entrées
d’exécution explicites sont requises : `runtimeSetupEntry` nécessite `setupEntry`, et les
artefacts `runtimeExtensions` ou `runtimeSetupEntry` manquants font échouer l’installation
ou la découverte au lieu de revenir silencieusement à la source. Si un paquet installé
déclare uniquement une entrée source TypeScript, OpenClaw utilisera un pair `dist/*.js`
compilé correspondant lorsqu’il existe, puis reviendra à la source TypeScript.

Tous les chemins d’entrée doivent rester à l’intérieur du répertoire du paquet du plugin.
Les entrées d’exécution et les pairs JavaScript compilés inférés ne rendent pas valide un
chemin source `extensions` ou `setupEntry` qui s’en échappe.

<Tip>
  **Vous cherchez un guide pas à pas ?** Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour des guides étape par étape.
</Tip>

## `definePluginEntry`

**Importation :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseur, les plugins d’outils, les plugins de hooks et tout ce qui
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

| Champ          | Type                                                             | Obligatoire | Valeur par défaut       |
| -------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`           | `string`                                                         | Oui         | -                       |
| `name`         | `string`                                                         | Oui         | -                       |
| `description`  | `string`                                                         | Oui         | -                       |
| `kind`         | `string`                                                         | Non         | -                       |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui         | -                       |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` est destiné aux emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et mémorise ce schéma au premier accès, afin que les constructeurs
  de schémas coûteux ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Enveloppe `definePluginEntry` avec un câblage propre aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose un seam optionnel de métadonnées CLI pour l’aide
racine, et limite `registerFull` selon le mode d’enregistrement.

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

| Champ                 | Type                                                             | Obligatoire | Valeur par défaut       |
| --------------------- | ---------------------------------------------------------------- | ----------- | ----------------------- |
| `id`                  | `string`                                                         | Oui         | -                       |
| `name`                | `string`                                                         | Oui         | -                       |
| `description`         | `string`                                                         | Oui         | -                       |
| `plugin`              | `ChannelPlugin`                                                  | Oui         | -                       |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non         | -                       |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non         | -                       |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non         | -                       |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence
  d’exécution (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture
  des métadonnées CLI.
- `registerCliMetadata` s’exécute pendant `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` et
  `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI détenus par le canal afin que l’aide racine
  reste non activante, que les instantanés de découverte incluent les métadonnées de commandes statiques, et que
  l’enregistrement normal des commandes CLI reste compatible avec les chargements complets du plugin.
- L’enregistrement de découverte est non activant, pas sans importation. OpenClaw peut
  évaluer l’entrée de plugin de confiance et le module du plugin de canal pour construire
  l’instantané ; gardez donc les importations de haut niveau sans effets de bord et placez les sockets,
  clients, workers et services derrière des chemins réservés à `"full"`.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  pendant le chargement de configuration uniquement.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  mémorise le schéma résolu au premier accès.
- Pour les commandes CLI racine détenues par un plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  quand vous voulez que la commande reste chargée paresseusement sans disparaître de l’arbre d’analyse
  de la CLI racine. Pour les plugins de canal, préférez enregistrer ces descripteurs depuis
  `registerCliMetadata(...)` et garder `registerFull(...)` centré sur le travail propre à l’exécution.
- Si `registerFull(...)` enregistre aussi des méthodes RPC du Gateway, conservez-les sous un
  préfixe propre au plugin. Les espaces de noms d’administration du cœur réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours contraints à
  `operator.admin`.

## `defineSetupPluginEntry`

**Importation :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Retourne seulement `{ plugin }`, sans
câblage d’exécution ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci à la place de l’entrée complète lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Consultez
[Configuration et paramétrage](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela compte.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites de helpers de configuration :

- `openclaw/plugin-sdk/setup-runtime` pour les helpers de configuration sûrs pour l’exécution tels que
  les adaptateurs de correctifs de configuration sûrs à importer, la sortie de notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les proxys de configuration délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces de configuration d’installation optionnelle
- `openclaw/plugin-sdk/setup-tools` pour les helpers CLI/archive/docs de configuration et d’installation

Gardez les SDK lourds, l’enregistrement CLI et les services d’exécution à longue durée de vie dans l’entrée
complète.

Les canaux d’espace de travail intégrés qui séparent les surfaces de configuration et d’exécution peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet à l’entrée de configuration de conserver
des exports plugin/secrets sûrs pour la configuration tout en exposant un setter
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
});
```

Utilisez ce contrat intégré seulement lorsque les flux de configuration ont réellement besoin d’un setter
d’exécution léger avant le chargement de l’entrée complète du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode              | Quand                             | Ce qu’il faut enregistrer                                                                                                        |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal du Gateway       | Tout                                                                                                                            |
| `"discovery"`     | Découverte de capacités en lecture seule | Enregistrement du canal plus descripteurs CLI statiques ; le code d’entrée peut se charger, mais ignorez sockets, workers, clients et services |
| `"setup-only"`    | Canal désactivé/non configuré     | Enregistrement du canal uniquement                                                                                              |
| `"setup-runtime"` | Flux de configuration avec exécution disponible | Enregistrement du canal plus uniquement l’exécution légère nécessaire avant le chargement de l’entrée complète                   |
| `"cli-metadata"`  | Aide racine / capture de métadonnées CLI | Descripteurs CLI uniquement                                                                                                     |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
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

Le mode découverte construit un instantané de registre non activant. Il peut encore évaluer
l’entrée du plugin et l’objet du plugin de canal afin qu’OpenClaw puisse enregistrer les
capacités de canal et les descripteurs CLI statiques. Considérez l’évaluation de module en découverte comme
fiable mais légère : pas de clients réseau, sous-processus, écouteurs, connexions à des bases de données,
workers en arrière-plan, lectures d’identifiants, ni autres effets de bord d’exécution actifs au niveau supérieur.

Considérez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage de configuration uniquement doivent
exister sans réentrer dans l’exécution complète du canal intégré. Les bons candidats sont
l’enregistrement du canal, les routes HTTP sûres pour la configuration, les méthodes Gateway sûres pour la configuration et
les helpers de configuration délégués. Les services d’arrière-plan lourds, les registraires CLI et les
initialisations de SDK fournisseur/client appartiennent toujours à `"full"`.

Pour les registraires CLI en particulier :

- utilisez `descriptors` lorsque le registraire possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI lors de la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de haut niveau exposée par le
  registraire
- limitez les noms de commandes des descripteurs aux lettres, chiffres, traits d’union et underscores,
  en commençant par une lettre ou un chiffre ; OpenClaw rejette les noms de descripteurs en dehors
  de cette forme et retire les séquences de contrôle terminal des descriptions avant
  d’afficher l’aide
- utilisez `commands` seul uniquement pour les chemins de compatibilité impatients

## Formes de plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un seul type de capacité (p. ex. fournisseur uniquement) |
| **hybrid-capability** | Plusieurs types de capacités (p. ex. fournisseur + speech) |
| **hook-only**         | Hooks uniquement, aucune capacité                  |
| **non-capability**    | Outils/commandes/services, mais aucune capacité    |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Associé

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - API d’enregistrement et référence des sous-chemins
- [Assistants d’exécution](/fr/plugins/sdk-runtime) - `api.runtime` et `createPluginRuntimeStore`
- [Configuration et config](/fr/plugins/sdk-setup) - manifeste, point d’entrée de configuration, chargement différé
- [Plugins de canaux](/fr/plugins/sdk-channel-plugins) - création de l’objet `ChannelPlugin`
- [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins) - enregistrement des fournisseurs et hooks
